import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { DeVoiceShell } from "@/components/devoice-shell";
import { MyResourcesTable } from "@/components/my-resources-table";
import { authOptions } from "@/lib/auth";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { dateLocale, getDictionary, isLocale, localizedPath, siteUrl, type Locale } from "@/lib/i18n";
import { localJobDates, localJobsCookieName, parseLocalJobs, visibleLocalJobs } from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ResourcePageJob = {
  id: string;
  fileName: string | null;
  sourceUrl: string | null;
  sourceType: string;
  durationSec: number | null;
  status: string;
  createdAt: Date;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale).resources;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `${siteUrl}${localizedPath(locale, "my-resources")}`
    }
  };
}

function formatDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export default async function MyResourcesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale).resources;
  const session = await getServerSession(authOptions);

  let jobs: ResourcePageJob[];
  if (!session?.user?.id) {
    jobs = [];
  } else {
    const cookieStore = await cookies();
    const localJobs = visibleLocalJobs(parseLocalJobs(cookieStore.get(localJobsCookieName)?.value), session.user.id)
      .map(localJobDates)
      .map((job) => ({
        id: job.id,
        fileName: job.fileName,
        sourceUrl: job.sourceUrl,
        sourceType: job.sourceType,
        durationSec: job.durationSec,
        status: job.status,
        createdAt: job.createdAt
      }));
    const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
    if (isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()) {
      jobs = [];
    } else {
      try {
        jobs = await withDatabaseTimeout(prisma.mediaJob.findMany({
        where: { OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }] },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          fileName: true,
          sourceUrl: true,
          sourceType: true,
          durationSec: true,
          status: true,
          createdAt: true
        }
        }), {
          message: "DeVoice resource history lookup timed out."
        });
      } catch (error) {
        warnDatabaseFallback("Falling back to local DeVoice resource history because the database is unavailable", error);
        jobs = [];
      }
    }
    jobs = [...localJobs, ...jobs];
  }

  return (
    <DeVoiceShell locale={locale}>
      <section className="resourcePage">
        <div className="resourceHeader">
          <div>
            <h1>{t.title}</h1>
            <p>{t.description}</p>
          </div>
          <span className="resourceRetention">{t.retention}</span>
        </div>

        <MyResourcesTable
          locale={locale}
          jobs={jobs.map((job) => ({
            ...job,
            createdAt: formatDate(job.createdAt, locale)
          }))}
        />
      </section>
    </DeVoiceShell>
  );
}
