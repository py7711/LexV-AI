import { prisma } from "@/lib/prisma";
import { completeJobWithDemoResult } from "@/lib/devoice-demo-processing";
import { getLocalMediaObject, isLocalMediaStorageKey, createLocalMediaDownloadUrl } from "@/lib/local-media-store";
import { summarizeWithFallback, transcribeWithFallback } from "@/lib/ai-providers";
import { estimateCreditCost, recordCreditUsage } from "@/lib/credits";
import { createDownloadUrl, hasR2Config } from "@/lib/r2";
import { translateWithFallback } from "@/lib/translation";
import { updateAudioSegmentPlanForJob } from "@/lib/media-audio-assets";
import { isDeVoiceJobType, type DeVoiceJobType } from "@/types/devoice-job";

type MediaJob = NonNullable<Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>>;

type TrailItem = {
  provider: string;
  status: "success" | "failed";
  message?: string;
  mode?: string;
};

function jobTypeOf(sourceType: string): DeVoiceJobType {
  return isDeVoiceJobType(sourceType) ? sourceType : "speech_to_text";
}

export function hasTranscriptionProvider() {
  return Boolean(process.env.DEEPGRAM_API_KEY || process.env.ASSEMBLYAI_API_KEY || process.env.GROQ_API_KEY);
}

export function isStandardTranscriptionJob(sourceType: string) {
  return sourceType === "speech_to_text" || sourceType === "audio_to_text" || sourceType === "video_to_text";
}

export function isLocalMediaJob(input: { sourceUrl?: string | null; storageKey?: string | null }) {
  return isLocalMediaStorageKey(input.storageKey) || isLocalMediaStorageKey(input.sourceUrl);
}

export function canResolveMediaForProvider(input: { sourceUrl?: string | null; storageKey?: string | null }) {
  if (isLocalMediaJob(input)) return true;
  if (input.sourceUrl && /^https?:\/\//i.test(input.sourceUrl)) return true;
  return Boolean(input.storageKey && !isLocalMediaStorageKey(input.storageKey) && hasR2Config());
}

export function shouldCompleteTranscriptionInline(input: {
  sourceType: string;
  sourceUrl?: string | null;
  storageKey?: string | null;
}) {
  return isStandardTranscriptionJob(input.sourceType) && (!hasTranscriptionProvider() || isLocalMediaJob(input) || !canResolveMediaForProvider(input));
}

async function resolveMediaInputForTranscription(job: MediaJob) {
  const mediaUrl = await resolveMediaUrlForTranscription(job);
  const storageKey = job.storageKey;
  const sourceUrl = job.sourceUrl;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    const object = await getLocalMediaObject({ storageKey });
    return {
      mediaUrl,
      media: {
        bytes: object.body,
        fileName: job.fileName ?? storageKey.split("/").pop(),
        contentType: undefined
      }
    };
  }

  if (sourceUrl && isLocalMediaStorageKey(sourceUrl)) {
    const object = await getLocalMediaObject({ storageKey: sourceUrl });
    return {
      mediaUrl,
      media: {
        bytes: object.body,
        fileName: job.fileName ?? sourceUrl.split("/").pop(),
        contentType: undefined
      }
    };
  }

  return { mediaUrl };
}

export async function resolveMediaUrlForTranscription(job: MediaJob) {
  const storageKey = job.storageKey;
  const sourceUrl = job.sourceUrl;

  if (storageKey) {
    if (isLocalMediaStorageKey(storageKey)) {
      return createLocalMediaDownloadUrl(storageKey);
    }

    return createDownloadUrl(storageKey, Number(process.env.R2_WORKER_DOWNLOAD_EXPIRES_IN ?? 1800));
  }

  if (sourceUrl) {
    if (isLocalMediaStorageKey(sourceUrl)) {
      return createLocalMediaDownloadUrl(sourceUrl);
    }

    return sourceUrl;
  }

  throw new Error("任务缺少可供 AI 服务商访问的媒体 URL。");
}

async function completeWithDemoFallback(job: MediaJob, trail: TrailItem[]) {
  const fallback = await completeJobWithDemoResult(job.id);
  const previousTrail = Array.isArray(fallback.fallbackTrail) ? fallback.fallbackTrail : [];
  return prisma.mediaJob.update({
    where: { id: fallback.id },
    data: {
      provider: `${fallback.provider ?? "DeVoice demo transcription engine"} (fallback)`,
      fallbackTrail: [...trail, ...previousTrail]
    }
  });
}

export async function completeTranscriptionJob(jobId: string) {
  const mediaJob = await prisma.mediaJob.findUnique({ where: { id: jobId } });
  if (!mediaJob) {
    throw new Error("任务不存在。");
  }

  const jobType = jobTypeOf(mediaJob.sourceType);
  const trail: TrailItem[] = [];

  if (!hasTranscriptionProvider()) {
    trail.push({
      provider: "DeVoice transcription providers",
      status: "failed",
      message: "No transcription provider is configured.",
      mode: "provider-config"
    });
    return completeWithDemoFallback(mediaJob, trail);
  }

  try {
    const mediaInput = await resolveMediaInputForTranscription(mediaJob);
    const transcriptResult = await transcribeWithFallback({
      ...mediaInput,
      language: mediaJob.language ?? undefined
    });
    const summaryResult = await summarizeWithFallback({
      transcript: transcriptResult.data.transcript,
      locale: mediaJob.language ?? undefined
    });
    const translationResult = mediaJob.targetLanguage
      ? await translateWithFallback({
          text: transcriptResult.data.transcript,
          sourceLanguage: mediaJob.language ?? undefined,
          targetLanguage: mediaJob.targetLanguage
        })
      : undefined;
    const providerLabel = `${transcriptResult.provider} + ${summaryResult.provider}${
      translationResult ? ` + ${translationResult.provider}` : ""
    }`;
    const finalCredits = estimateCreditCost(jobType, transcriptResult.data.durationSec);
    const prepaidCredits = Math.max(mediaJob.costCents ?? 0, 0);
    const additionalCredits = Math.max(0, finalCredits - prepaidCredits);

    const completedJob = await prisma.mediaJob.update({
      where: { id: mediaJob.id },
      data: {
        status: "completed",
        provider: providerLabel,
        fallbackTrail: [
          ...transcriptResult.trail,
          ...summaryResult.trail,
          ...(translationResult?.trail ?? []),
          {
            provider: "DeVoice media pipeline",
            status: "success",
            mode: isLocalMediaJob(mediaJob) ? "local-media-transcription" : "remote-media-transcription"
          }
        ],
        transcript: transcriptResult.data.transcript,
        subtitles: transcriptResult.data.subtitles,
        durationSec: transcriptResult.data.durationSec,
        costCents: finalCredits,
        summary: JSON.stringify(summaryResult.data),
        translation: translationResult?.data.text
      }
    });

    await updateAudioSegmentPlanForJob(mediaJob.id, transcriptResult.data.durationSec);

    if (mediaJob.workspaceId) {
      const usedMinutes = Math.ceil((transcriptResult.data.durationSec ?? 0) / 60);
      await prisma.$transaction([
        prisma.usageEvent.create({
          data: {
            workspaceId: mediaJob.workspaceId,
            mediaJobId: mediaJob.id,
            eventType: "media_processing",
            quantity: Math.max(usedMinutes, 1),
            unit: "minute",
            provider: providerLabel
          }
        }),
        prisma.workspace.update({
          where: { id: mediaJob.workspaceId },
          data: {
            usedMinutes: {
              increment: Math.max(usedMinutes, 1)
            }
          }
        })
      ]);

      if (additionalCredits > 0) {
        await recordCreditUsage({
          workspaceId: mediaJob.workspaceId,
          mediaJobId: mediaJob.id,
          sourceType: jobType,
          quantity: additionalCredits,
          provider: providerLabel
        });
      }
    }

    return completedJob;
  } catch (error) {
    trail.push({
      provider: "DeVoice transcription pipeline",
      status: "failed",
      message: error instanceof Error ? error.message : "Transcription failed.",
      mode: isLocalMediaJob(mediaJob) ? "local-media-transcription" : "remote-media-transcription"
    });

    if (process.env.DEVOICE_TRANSCRIPTION_DEMO_FALLBACK === "false") {
      await prisma.mediaJob.update({
        where: { id: mediaJob.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "媒体处理失败。",
          fallbackTrail: trail
        }
      });
      throw error;
    }

    return completeWithDemoFallback(mediaJob, trail);
  }
}
