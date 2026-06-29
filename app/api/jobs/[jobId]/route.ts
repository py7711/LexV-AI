import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import {
  localJobById,
  localJobsCookieName,
  readLocalJobsFromCookieHeader,
  removeLocalJob,
  serializeLocalJobs,
  updateLocalJob
} from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { translateWithFallback } from "@/lib/translation";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

const patchJobSchema = z.object({
  action: z.literal("translate"),
  targetLanguage: z.string().min(2).max(12),
  sourceView: z.enum(["transcript", "summary", "subtitles"]).default("transcript")
});

type TranslationJob = {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  storageKey: string | null;
  fileName: string | null;
  language: string | null;
  targetLanguage: string | null;
  status: string;
  provider: string | null;
  errorMessage: string | null;
  transcript: string | null;
  subtitles: string | null;
  summary: string | null;
  translation: string | null;
  durationSec: number | null;
  costCents: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function readableSummary(value: string | null) {
  if (!value?.trim()) return "";

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const lines = [String(parsed.summary ?? parsed.overview ?? "").trim()].filter(Boolean);

    if (Array.isArray(parsed.chapters) && parsed.chapters.length) {
      lines.push("Chapters:");
      for (const item of parsed.chapters) {
        if (!item || typeof item !== "object") continue;
        const chapter = item as Record<string, unknown>;
        const title = String(chapter.title ?? "").trim();
        if (!title) continue;
        const startSec = typeof chapter.startSec === "number" ? `${Math.floor(chapter.startSec)}s ` : "";
        lines.push(`- ${startSec}${title}`);
      }
    }

    if (Array.isArray(parsed.keywords) && parsed.keywords.length) {
      lines.push(`Keywords: ${parsed.keywords.map((item) => String(item)).join(", ")}`);
    }

    return lines.join("\n").trim();
  } catch {
    return value;
  }
}

function sourceTextForTranslation(job: TranslationJob, sourceView: z.infer<typeof patchJobSchema>["sourceView"]) {
  if (sourceView === "summary") return readableSummary(job.summary);
  if (sourceView === "subtitles") return job.subtitles?.trim() ?? "";
  return job.transcript?.trim() ?? "";
}

function demoTranslate(text: string, targetLanguage: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  const clipped = normalized.length > 1400 ? `${normalized.slice(0, 1400)}...` : normalized;
  return `[${targetLanguage.toUpperCase()}] ${clipped}`;
}

async function generateTranslation(job: TranslationJob, input: z.infer<typeof patchJobSchema>) {
  const sourceText = sourceTextForTranslation(job, input.sourceView);
  if (!sourceText) {
    throw new Error("No transcript, summary or subtitles are available to translate yet.");
  }

  try {
    const result = await translateWithFallback({
      text: sourceText,
      sourceLanguage: job.language ?? undefined,
      targetLanguage: input.targetLanguage
    });

    return {
      text: result.data.text,
      provider: result.provider
    };
  } catch (error) {
    console.warn("Falling back to local DeVoice translation.", error);
    return {
      text: demoTranslate(sourceText, input.targetLanguage),
      provider: "DeVoice demo translation"
    };
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice to view this resource." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const localJobs = readLocalJobsFromCookieHeader(_request.headers.get("cookie"));
  const localJob = localJobById(localJobs, session.user.id, jobId);
  if (localJob) {
    return NextResponse.json({ job: localJob });
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  let job;
  if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
    job = null;
  } else {
    try {
      job = await withDatabaseTimeout(prisma.mediaJob.findFirst({
      where: {
        id: jobId,
        OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }]
      },
      select: {
        id: true,
        sourceType: true,
        sourceUrl: true,
        storageKey: true,
        fileName: true,
        language: true,
        targetLanguage: true,
        status: true,
        provider: true,
        errorMessage: true,
        transcript: true,
        subtitles: true,
        summary: true,
        translation: true,
        durationSec: true,
        costCents: true,
        createdAt: true,
        updatedAt: true
        ,
        audioAssets: {
          select: {
            id: true,
            role: true,
            status: true,
            provider: true,
            storageKey: true,
            publicUrl: true,
            fileName: true,
            contentType: true,
            byteSize: true,
            durationSec: true,
            segments: {
              orderBy: { index: "asc" },
              select: {
                id: true,
                index: true,
                startSec: true,
                endSec: true,
                durationSec: true,
                storageKey: true,
                publicUrl: true,
                status: true
              }
            }
          }
        }
      }
      }), {
        message: "DeVoice job detail lookup timed out."
      });
    } catch (error) {
      console.warn("Unable to read DeVoice job from database.", error);
      job = null;
    }
  }

  if (!job) {
    return NextResponse.json({ error: "This resource does not exist or cannot be accessed." }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice to update this resource." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = patchJobSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid DeVoice result update request." }, { status: 400 });
  }

  const { jobId } = await context.params;
  const localJobs = readLocalJobsFromCookieHeader(request.headers.get("cookie"));
  const localJob = localJobById(localJobs, session.user.id, jobId);
  if (localJob) {
    try {
      const translation = await generateTranslation(localJob, parsed.data);
      const response = NextResponse.json({
        job: {
          ...localJob,
          targetLanguage: parsed.data.targetLanguage,
          translation: translation.text,
          provider: translation.provider,
          updatedAt: new Date().toISOString()
        },
        translation
      });
      response.cookies.set(localJobsCookieName, serializeLocalJobs(updateLocalJob(localJobs, session.user.id, jobId, {
        targetLanguage: parsed.data.targetLanguage,
        translation: translation.text,
        provider: translation.provider
      })), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax"
      });
      return response;
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Translation failed." }, { status: 400 });
    }
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  let job;
  if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
    job = null;
  } else {
    try {
      job = await withDatabaseTimeout(prisma.mediaJob.findFirst({
        where: {
          id: jobId,
          OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }]
        }
      }), {
        message: "DeVoice job translation lookup timed out."
      });
    } catch (error) {
      console.warn("Unable to read DeVoice job for translation.", error);
      job = null;
    }
  }

  if (!job) {
    return NextResponse.json({ error: "This resource does not exist or cannot be accessed." }, { status: 404 });
  }

  try {
    const translation = await generateTranslation(job, parsed.data);
    const updatedJob = await prisma.mediaJob.update({
      where: { id: job.id },
      data: {
        targetLanguage: parsed.data.targetLanguage,
        translation: translation.text,
        provider: translation.provider
      }
    });

    await writeAuditLog({
      workspaceId: job.workspaceId,
      actorUserId: session.user.id,
      action: "media_job.translation.generated",
      targetType: "MediaJob",
      targetId: job.id,
      request,
      metadata: {
        sourceView: parsed.data.sourceView,
        targetLanguage: parsed.data.targetLanguage,
        provider: translation.provider
      }
    });

    return NextResponse.json({ job: updatedJob, translation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Translation failed." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice to delete this resource." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const localJobs = readLocalJobsFromCookieHeader(request.headers.get("cookie"));
  const localJob = localJobById(localJobs, session.user.id, jobId);
  if (localJob) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(localJobsCookieName, serializeLocalJobs(removeLocalJob(localJobs, session.user.id, jobId)), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });
    return response;
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  let job;
  if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
    job = null;
  } else {
    try {
      job = await withDatabaseTimeout(prisma.mediaJob.findFirst({
      where: {
        id: jobId,
        OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }]
      },
      select: {
        id: true,
        workspaceId: true,
        sourceType: true,
        fileName: true,
        sourceUrl: true
      }
      }), {
        message: "DeVoice job delete lookup timed out."
      });
    } catch (error) {
      console.warn("Unable to read DeVoice job for deletion from database.", error);
      job = null;
    }
  }

  if (!job) {
    return NextResponse.json({ error: "This resource does not exist or cannot be accessed." }, { status: 404 });
  }

  await prisma.mediaJob.delete({ where: { id: job.id } });

  await writeAuditLog({
    workspaceId: job.workspaceId,
    actorUserId: session.user.id,
    action: "media_job.deleted",
    targetType: "MediaJob",
    targetId: job.id,
    request,
    metadata: {
      sourceType: job.sourceType,
      fileName: job.fileName,
      sourceUrl: job.sourceUrl
    }
  });

  return NextResponse.json({ ok: true });
}
