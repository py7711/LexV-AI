import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { estimateCreditCost, getRemainingCredits, recordCreditUsage } from "@/lib/credits";
import { completeJobWithDemoResult } from "@/lib/devoice-demo-processing";
import { completeNoiseJobWithProviderResult, shouldUseNoiseProviderForJob } from "@/lib/devoice-noise-processing";
import { completeVoiceJobWithProviderResult, shouldUseSpeechProviderForJob } from "@/lib/devoice-voice-processing";
import { isYoutubeJobType, isYoutubeUrl } from "@/lib/devoice-youtube";
import { createSourceAudioAsset, updateAudioSegmentPlanForJob } from "@/lib/media-audio-assets";
import {
  createLocalJob,
  localJobsCookieName,
  prependLocalJob,
  readLocalJobsFromCookieHeader,
  serializeLocalJobs,
  visibleLocalJobs
} from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { enqueueMediaJob } from "@/lib/queue";
import { rememberRecentJob } from "@/lib/redis";
import { getAccessibleWorkspaceIds, resolveWritableWorkspace } from "@/lib/workspace";
import { devoiceJobTypes } from "@/types/devoice-job";

const createJobSchema = z.object({
  sourceUrl: z.string().min(3).max(4000).optional(),
  storageKey: z.string().min(3).max(512).optional(),
  fileName: z.string().max(180).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  contentType: z.string().max(120).optional(),
  example: z.boolean().optional(),
  language: z.string().min(2).max(12).optional(),
  targetLanguage: z.string().min(2).max(12).optional(),
  workspaceId: z.string().optional(),
  sourceType: z.enum(devoiceJobTypes).default("speech_to_text")
}).refine((data) => data.sourceUrl || data.storageKey, {
  message: "必须提供媒体链接或 R2 存储 Key。"
});

function hasTranscriptionProvider() {
  return Boolean(process.env.DEEPGRAM_API_KEY || process.env.ASSEMBLYAI_API_KEY || process.env.GROQ_API_KEY);
}

function shouldCompleteInline(sourceType: string) {
  if (process.env.DEVOICE_INLINE_DEMO_RESULTS === "false") {
    return false;
  }

  // YouTube、语音生成和降噪类任务都有可用的演示结果或同步服务商路径。
  // 如果没有转写服务商，也同步完成，避免用户卡在永远 queued 的状态。
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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice to view your resources." }, { status: 401 });
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);

  if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
    return NextResponse.json({ jobs: visibleLocalJobs(readLocalJobsFromCookieHeader(request.headers.get("cookie")), session.user.id) });
  }

  try {
    const jobs = await withDatabaseTimeout(prisma.mediaJob.findMany({
      where: {
        OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }]
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50,
      select: {
        id: true,
        sourceType: true,
        sourceUrl: true,
        fileName: true,
        language: true,
        targetLanguage: true,
        status: true,
        provider: true,
        durationSec: true,
        costCents: true,
        createdAt: true,
        updatedAt: true
      }
    }), {
      message: "DeVoice job list lookup timed out."
    });

    return NextResponse.json({
      jobs: [
        ...visibleLocalJobs(readLocalJobsFromCookieHeader(request.headers.get("cookie")), session.user.id),
        ...jobs
      ]
    });
  } catch (error) {
    console.warn("Falling back to local DeVoice jobs because the database is unavailable.", error);
    return NextResponse.json({ jobs: visibleLocalJobs(readLocalJobsFromCookieHeader(request.headers.get("cookie")), session.user.id) });
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createJobSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "请求参数无效，请提交合法的媒体链接。" }, { status: 400 });
  }

  if (isYoutubeJobType(parsed.data.sourceType) && (!parsed.data.sourceUrl || !isYoutubeUrl(parsed.data.sourceUrl))) {
    return NextResponse.json({ error: "Please submit a valid YouTube video URL for this tool." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice to process your file." }, { status: 401 });
  }

  const workspace = await resolveWritableWorkspace(
    {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    },
    parsed.data.workspaceId
  );
  const estimatedCredits = estimateCreditCost(parsed.data.sourceType);

  if (workspace.id) {
    const remainingCredits = await getRemainingCredits(session.user.id);
    if (remainingCredits < estimatedCredits) {
      return NextResponse.json(
        { error: "Your DeVoice credits are used up. Please check in or buy more credits to continue." },
        { status: 402 }
      );
    }
  }

  // Create a DeVoice processing record, then hand it to the media worker.
  let job;
  if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
    // 数据库不可用或本地演示账号使用 Cookie 保存短期任务，保证核心 UI 可以离线演示。
    const localJob = createLocalJob({
      userId: session.user.id,
      workspaceId: workspace.id,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl,
      storageKey: parsed.data.storageKey,
      fileName: parsed.data.fileName,
      language: parsed.data.language,
      targetLanguage: parsed.data.targetLanguage,
      costCents: estimatedCredits
    });
    const localJobs = prependLocalJob(readLocalJobsFromCookieHeader(request.headers.get("cookie")), localJob);
    const response = NextResponse.json({
      job: {
        id: localJob.id,
        sourceType: localJob.sourceType,
        status: localJob.status,
        createdAt: localJob.createdAt
      },
      queue: { queued: false, reason: "Local DeVoice demo result generated for this local account." }
    });
    response.cookies.set(localJobsCookieName, serializeLocalJobs(localJobs), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });
    return response;
  }

  try {
    job = await withDatabaseTimeout(prisma.mediaJob.create({
      data: {
        userId: session.user.id,
        workspaceId: workspace.id,
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
        sourceType: true,
        status: true,
        createdAt: true
      }
    }), {
      message: "DeVoice job creation timed out."
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
  } catch (error) {
    console.warn("Creating local DeVoice job because the database is unavailable.", error);
    const localJob = createLocalJob({
      userId: session.user.id,
      workspaceId: workspace.id,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl,
      storageKey: parsed.data.storageKey,
      fileName: parsed.data.fileName,
      language: parsed.data.language,
      targetLanguage: parsed.data.targetLanguage,
      costCents: estimatedCredits
    });
    const localJobs = prependLocalJob(readLocalJobsFromCookieHeader(request.headers.get("cookie")), localJob);
    const response = NextResponse.json({
      job: {
        id: localJob.id,
        sourceType: localJob.sourceType,
        status: localJob.status,
        createdAt: localJob.createdAt
      },
      queue: { queued: false, reason: "Local DeVoice demo result generated while the database is unavailable." }
    });
    response.cookies.set(localJobsCookieName, serializeLocalJobs(localJobs), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });
    return response;
  }

  const queueResult = shouldCompleteInline(job.sourceType)
    ? { queued: false, reason: "Inline DeVoice demo result generated for this local processing flow." }
    : await enqueueMediaJob({
        jobId: job.id,
        requestedBy: session.user.id
      });

  if (!queueResult.queued) {
    // 队列不可用时仍尽量产出结果：真实同步服务商优先，其次写入演示结果。
    const completedJob = shouldUseSpeechProviderForJob(job.sourceType)
      ? await completeVoiceJobWithProviderResult(job.id)
      : shouldUseNoiseProviderForJob(job.sourceType)
        ? await completeNoiseJobWithProviderResult(job.id)
        : await completeJobWithDemoResult(job.id);
    job = {
      id: completedJob.id,
      sourceType: completedJob.sourceType,
      status: completedJob.status,
      createdAt: completedJob.createdAt
    };
    await updateAudioSegmentPlanForJob(completedJob.id, completedJob.durationSec);
  }

  await recordCreditUsage({
    workspaceId: workspace.id,
    mediaJobId: job.id,
    sourceType: job.sourceType,
    quantity: estimatedCredits,
    provider: "DeVoice web"
  });

  await rememberRecentJob({
    id: job.id,
    sourceType: job.sourceType,
    createdAt: job.createdAt.toISOString()
  });

  await writeAuditLog({
    workspaceId: workspace.id,
    actorUserId: session.user.id,
    action: "media_job.created",
    targetType: "MediaJob",
    targetId: job.id,
    request,
    metadata: {
      sourceType: job.sourceType,
      status: job.status,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize,
      contentType: parsed.data.contentType,
      example: parsed.data.example,
      queue: queueResult,
      credits: estimatedCredits,
      via: "web"
    }
  });

  return NextResponse.json({ job, queue: queueResult });
}
