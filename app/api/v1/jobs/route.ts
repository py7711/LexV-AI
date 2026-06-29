import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { verifyApiKey } from "@/lib/api-keys";
import { estimateCreditCost, recordCreditUsage } from "@/lib/credits";
import { completeJobWithDemoResult } from "@/lib/devoice-demo-processing";
import { completeNoiseJobWithProviderResult, shouldUseNoiseProviderForJob } from "@/lib/devoice-noise-processing";
import { completeVoiceJobWithProviderResult, shouldUseSpeechProviderForJob } from "@/lib/devoice-voice-processing";
import { isYoutubeJobType, isYoutubeUrl } from "@/lib/devoice-youtube";
import { createSourceAudioAsset, updateAudioSegmentPlanForJob } from "@/lib/media-audio-assets";
import { enqueueMediaJob } from "@/lib/queue";
import { rememberRecentJob } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { devoiceJobTypes } from "@/types/devoice-job";

const apiCreateJobSchema = z.object({
  sourceUrl: z.string().url().optional(),
  storageKey: z.string().min(3).max(512).optional(),
  fileName: z.string().max(180).optional(),
  contentType: z.string().max(120).optional(),
  language: z.string().min(2).max(12).optional(),
  targetLanguage: z.string().min(2).max(12).optional(),
  sourceType: z.enum(devoiceJobTypes).default("speech_to_text")
}).refine((data) => data.sourceUrl || data.storageKey, {
  message: "必须提供 sourceUrl 或 storageKey。"
});

function hasTranscriptionProvider() {
  return Boolean(process.env.DEEPGRAM_API_KEY || process.env.ASSEMBLYAI_API_KEY || process.env.GROQ_API_KEY);
}

function shouldCompleteInline(sourceType: string) {
  if (process.env.DEVOICE_INLINE_DEMO_RESULTS === "false") {
    return false;
  }

  // 开发者 API 与 Web 端保持一致：无队列或无转写服务商时不让任务长时间停留在 queued。
  return isYoutubeJobType(sourceType) || sourceType === "remove_noise" || sourceType === "voice_enhance" || sourceType === "voice_change" || sourceType === "audio_extract" || sourceType === "ai_dubbing" || sourceType === "ai_music" || sourceType === "ai_rap" || sourceType === "rap_lyrics" || sourceType === "text_to_speech" || sourceType === "voice_clone" || !hasTranscriptionProvider();
}

function shouldCreateAudioAsset(sourceType: string) {
  return sourceType === "speech_to_text" ||
    sourceType === "audio_to_text" ||
    sourceType === "video_to_text" ||
    sourceType === "remove_noise" ||
    sourceType === "voice_enhance" ||
    sourceType === "voice_change" ||
    sourceType === "audio_extract" ||
    sourceType === "voice_clone";
}

async function getWorkspaceRemainingCredits(workspaceId: string) {
  // API Key 没有用户签到免费额度，只按工作空间购买 credits 和消费流水计算。
  const [purchases, usage] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        workspaceId,
        action: "credits.purchase.completed"
      },
      select: {
        metadata: true
      }
    }),
    prisma.usageEvent.aggregate({
      where: {
        workspaceId,
        unit: "credit"
      },
      _sum: {
        quantity: true
      }
    })
  ]);

  const paidCredits = purchases.reduce((total, purchase) => {
    const metadata = purchase.metadata;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return total;
    const credits = Number((metadata as Record<string, unknown>).credits ?? 0);
    return Number.isFinite(credits) ? total + credits : total;
  }, 0);

  return Math.max(0, paidCredits - (usage._sum.quantity ?? 0));
}

export async function POST(request: Request) {
  const apiKey = await verifyApiKey(request.headers.get("authorization"));

  if (!apiKey) {
    return NextResponse.json({ error: "API Key 无效或缺失。" }, { status: 401 });
  }

  const parsed = apiCreateJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
  }

  if (isYoutubeJobType(parsed.data.sourceType) && (!parsed.data.sourceUrl || !isYoutubeUrl(parsed.data.sourceUrl))) {
    return NextResponse.json({ error: "请为此工具提交有效的 YouTube 视频链接。" }, { status: 400 });
  }

  const estimatedCredits = estimateCreditCost(parsed.data.sourceType);
  const remainingCredits = await getWorkspaceRemainingCredits(apiKey.workspaceId);
  if (remainingCredits < estimatedCredits) {
    return NextResponse.json({ error: "Your DeVoice API credits are used up. Please buy more credits to continue." }, { status: 402 });
  }

  let job = await prisma.mediaJob.create({
    data: {
      workspaceId: apiKey.workspaceId,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl,
      storageKey: parsed.data.storageKey,
      fileName: parsed.data.fileName,
      language: parsed.data.language,
      targetLanguage: parsed.data.targetLanguage,
      status: "queued",
      costCents: estimatedCredits
    },
    select: {
      id: true,
      status: true,
      sourceType: true,
      createdAt: true
    }
  });

  if (shouldCreateAudioAsset(parsed.data.sourceType)) {
    const fullJob = await prisma.mediaJob.findUnique({ where: { id: job.id } });
    if (fullJob) {
      await createSourceAudioAsset({
        job: fullJob,
        contentType: parsed.data.contentType
      });
    }
  }

  const queue = shouldCompleteInline(job.sourceType)
    ? { queued: false, reason: "Inline DeVoice demo result generated for this local processing flow." }
    : await enqueueMediaJob({ jobId: job.id });

  if (!queue.queued) {
    // 队列不可用时，优先走可同步调用的真实服务商，否则写入演示结果。
    const completedJob = shouldUseSpeechProviderForJob(job.sourceType)
      ? await completeVoiceJobWithProviderResult(job.id)
      : shouldUseNoiseProviderForJob(job.sourceType)
        ? await completeNoiseJobWithProviderResult(job.id)
        : await completeJobWithDemoResult(job.id);
    job = {
      id: completedJob.id,
      status: completedJob.status,
      sourceType: completedJob.sourceType,
      createdAt: completedJob.createdAt
    };
    await updateAudioSegmentPlanForJob(completedJob.id, completedJob.durationSec);
  }

  await recordCreditUsage({
    workspaceId: apiKey.workspaceId,
    mediaJobId: job.id,
    sourceType: job.sourceType,
    quantity: estimatedCredits,
    provider: "DeVoice API"
  });

  await rememberRecentJob({
    id: job.id,
    sourceType: job.sourceType,
    createdAt: job.createdAt.toISOString()
  });

  await writeAuditLog({
    workspaceId: apiKey.workspaceId,
    actorType: "api_key",
    action: "media_job.created",
    targetType: "MediaJob",
    targetId: job.id,
    request,
    metadata: {
      sourceType: job.sourceType,
      apiKeyId: apiKey.id,
      credits: estimatedCredits,
      via: "api"
    }
  });

  return NextResponse.json({ job, queue }, { status: 201 });
}
