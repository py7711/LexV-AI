import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { DeVoiceJobResult } from "@/components/devoice-job-result";
import { DeVoiceShell } from "@/components/devoice-shell";
import { authOptions } from "@/lib/auth";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { localJobById, localJobsCookieName, parseLocalJobs } from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { isLocale, localizedPath } from "@/lib/i18n";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

type PageProps = {
  params: Promise<{ locale: string; jobId: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { locale: rawLocale, jobId } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(localizedPath(locale));
  }

  const cookieStore = await cookies();
  const localJob = localJobById(parseLocalJobs(cookieStore.get(localJobsCookieName)?.value), session.user.id, jobId);
  if (localJob) {
    return (
      <DeVoiceShell locale={locale}>
        <DeVoiceJobResult initialJob={localJob} locale={locale} />
      </DeVoiceShell>
    );
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
        updatedAt: true,
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
      warnDatabaseFallback("Unable to read DeVoice job from database", error);
      job = null;
    }
  }

  if (!job) {
    notFound();
  }

  const initialJob = {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };

  return (
    <DeVoiceShell locale={locale}>
      <DeVoiceJobResult initialJob={initialJob} locale={locale} />
    </DeVoiceShell>
  );
}
