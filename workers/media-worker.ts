import { Worker } from "bullmq";
import { prisma } from "@/lib/prisma";
import { queueName } from "@/lib/config";
import { completeJobWithDemoResult } from "@/lib/devoice-demo-processing";
import { completeNoiseJobWithProviderResult, shouldUseNoiseProviderForJob } from "@/lib/devoice-noise-processing";
import { completeVoiceJobWithProviderResult, shouldUseSpeechProviderForJob } from "@/lib/devoice-voice-processing";
import { summarizeWithFallback, transcribeWithFallback } from "@/lib/ai-providers";
import { estimateCreditCost, recordCreditUsage } from "@/lib/credits";
import { createSourceAudioAsset, updateAudioSegmentPlanForJob } from "@/lib/media-audio-assets";
import { createDownloadUrl } from "@/lib/r2";
import { translateWithFallback } from "@/lib/translation";
import { isDeVoiceJobType, type DeVoiceJobType } from "@/types/devoice-job";

type MediaQueuePayload = {
  jobId: string;
  requestedBy?: string;
};

function buildRedisConnection() {
  const url = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_URL ?? process.env.KV_URL;

  if (!url) {
    throw new Error("缺少 Redis TCP 连接串，BullMQ worker 无法启动。");
  }

  return {
    url,
    // BullMQ 明确要求 maxRetriesPerRequest=null；否则 ioredis 会在 Worker 模式下报配置错误。
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: Number(process.env.DEVOICE_QUEUE_CONNECT_TIMEOUT_MS ?? process.env.LEXV_QUEUE_CONNECT_TIMEOUT_MS ?? 3000),
    retryStrategy: () => null,
    tls: url.startsWith("rediss://") ? {} : undefined
  };
}

async function resolveMediaUrl(job: Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>) {
  if (!job) {
    throw new Error("任务不存在。");
  }

  if (job.storageKey) {
    if (job.storageKey.startsWith("local://")) {
      return job.sourceUrl ?? job.storageKey;
    }

    // 个人私有媒体优先使用 R2 短时签名下载 URL，避免要求 Bucket 公开。
    return createDownloadUrl(job.storageKey, Number(process.env.R2_WORKER_DOWNLOAD_EXPIRES_IN ?? 1800));
  }

  if (job.sourceUrl) {
    return job.sourceUrl;
  }

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (job.storageKey && publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${job.storageKey}`;
  }

  throw new Error("任务缺少可供 AI 服务商访问的媒体 URL。");
}

function jobTypeOf(sourceType: string): DeVoiceJobType {
  return isDeVoiceJobType(sourceType) ? sourceType : "speech_to_text";
}

// Worker 独立于 Next.js API 运行，适合部署到 Fly.io、Railway、Render、Docker 或云服务器。
const worker = new Worker<MediaQueuePayload>(
  queueName,
  async (bullJob) => {
    const mediaJob = await prisma.mediaJob.findUnique({ where: { id: bullJob.data.jobId } });
    if (!mediaJob) {
      throw new Error("任务不存在。");
    }
    await createSourceAudioAsset({ job: mediaJob });
    const mediaUrl = await resolveMediaUrl(mediaJob);
    const jobType = jobTypeOf(mediaJob?.sourceType ?? "");

    // 先落 processing，前端资源页可以立即显示任务已被 Worker 接管。
    await prisma.mediaJob.update({
      where: { id: bullJob.data.jobId },
      data: { status: "processing" }
    });

    try {
      if (shouldUseSpeechProviderForJob(jobType)) {
        // TTS、配音和声音克隆类任务由语音专用服务商处理，不经过转写/摘要链路。
        await completeVoiceJobWithProviderResult(bullJob.data.jobId);
        return;
      }

      if (shouldUseNoiseProviderForJob(jobType)) {
        // 降噪和人声增强优先走音频隔离服务商。
        await completeNoiseJobWithProviderResult(bullJob.data.jobId);
        return;
      }

      if (jobType === "remove_noise" || jobType === "voice_enhance" || jobType === "voice_change" || jobType === "audio_extract" || jobType === "text_to_speech" || jobType === "voice_clone") {
        // 未配置真实服务商时，这些工具仍可写入可展示、可导出的演示结果。
        await completeJobWithDemoResult(bullJob.data.jobId);
        return;
      }

      // 标准媒体任务链路：转写 -> 摘要 -> 可选翻译，每一步都内部支持服务商降级。
      const transcriptResult = await transcribeWithFallback({
        mediaUrl,
        language: mediaJob?.language ?? undefined
      });
      const summaryResult = await summarizeWithFallback({
        transcript: transcriptResult.data.transcript,
        locale: mediaJob?.language ?? undefined
      });
      const translationResult = mediaJob?.targetLanguage
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
      const prepaidCredits = Math.max(mediaJob?.costCents ?? 0, 0);
      const additionalCredits = Math.max(0, finalCredits - prepaidCredits);

      await prisma.mediaJob.update({
        where: { id: bullJob.data.jobId },
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
              mode: "audio-asset-and-segment-plan"
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
      await updateAudioSegmentPlanForJob(bullJob.data.jobId, transcriptResult.data.durationSec);

      if (mediaJob?.workspaceId) {
        const usedMinutes = Math.ceil((transcriptResult.data.durationSec ?? 0) / 60);
        // 分钟用量和 credits 消费分开记录：前者用于容量统计，后者用于余额扣减。
        const usageWrites = [
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
        ];

        await prisma.$transaction(usageWrites);

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
    } catch (error) {
      await prisma.mediaJob.update({
        where: { id: bullJob.data.jobId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "媒体处理失败。"
        }
      });
      throw error;
    }
  },
  {
    connection: buildRedisConnection(),
    concurrency: Number(process.env.DEVOICE_WORKER_CONCURRENCY ?? process.env.LEXV_WORKER_CONCURRENCY ?? 3)
  }
);

worker.on("completed", (job) => {
  console.log(`DeVoice media job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`DeVoice media job failed: ${job?.id}`, error);
});

worker.on("error", (error) => {
  console.error("DeVoice BullMQ worker Redis connection failed. Check that REDIS_URL is a reachable rediss:// TCP URL.", error);
  void worker.close().finally(() => process.exit(1));
});
