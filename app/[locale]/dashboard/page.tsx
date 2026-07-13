import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import {
  Captions,
  Clock3,
  FileAudio,
  FileText,
  Gauge,
  Gift,
  Headphones,
  MicVocal,
  PlayCircle,
  Youtube
} from "lucide-react";
import { BillingAction } from "@/components/billing-actions";
import { DeVoiceShell } from "@/components/devoice-shell";
import { authOptions } from "@/lib/auth";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { getCreditState } from "@/lib/credits";
import { addLocalCreditsToState, localCreditCookieName, parseLocalCreditLedger } from "@/lib/local-credits";
import { localJobDates, localJobsCookieName, parseLocalJobs, visibleLocalJobs } from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { dateLocale, getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { getAccessibleWorkspaceIds, getOrCreateDefaultWorkspace } from "@/lib/workspace";

type PageProps = {
  params: Promise<{ locale: string }>;
};

function formatDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    queued: "Queued",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed"
  };
  return map[status] ?? status;
}

function sourceTypeLabel(sourceType: string) {
  const map: Record<string, string> = {
    speech_to_text: "Speech to Text",
    audio_to_text: "Audio to Text",
    video_to_text: "Video to Text",
    youtube_transcript: "YouTube Transcript",
    youtube_subtitle: "YouTube Subtitle",
    youtube_summary: "YouTube Summary",
    remove_noise: "Remove Noise",
    voice_enhance: "Voice Enhancer",
    voice_change: "Voice Changer",
    audio_extract: "Audio Extractor",
    ai_dubbing: "AI Dubbing",
    ai_music: "AI Music",
    ai_rap: "AI Rap",
    rap_lyrics: "Rap Lyrics",
    text_to_speech: "Text to Speech",
    voice_clone: "Voice Cloning"
  };
  return map[sourceType] ?? sourceType;
}

function isYoutubeJob(sourceType: string) {
  return sourceType.startsWith("youtube_");
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const t = dict.dashboard;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(localizedPath(locale));
  }

  const workspace = await getOrCreateDefaultWorkspace({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
  });
  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  const jobWhere = { OR: [{ userId: session.user.id }, { workspaceId: { in: workspaceIds } }] };

  const cookieStore = await cookies();
  const localCredits = parseLocalCreditLedger(cookieStore.get(localCreditCookieName)?.value);
  const localJobs = visibleLocalJobs(parseLocalJobs(cookieStore.get(localJobsCookieName)?.value), session.user.id).map(localJobDates);
  const [dbJobs, dbCounts, creditState] = await Promise.all([
    isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()
      ? Promise.resolve([])
      : withDatabaseTimeout(prisma.mediaJob.findMany({
          where: jobWhere,
          orderBy: { createdAt: "desc" },
          take: 30,
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
            createdAt: true
          }
        }), {
          message: "DeVoice dashboard jobs lookup timed out."
        }).catch((error) => {
          warnDatabaseFallback("Falling back to local DeVoice dashboard jobs because the database is unavailable", error);
          return [];
        }),
    isLocalDeVoiceUser(session.user.id) || shouldUseDatabaseFallback()
      ? Promise.resolve([])
      : withDatabaseTimeout(prisma.mediaJob.groupBy({
          by: ["status"],
          where: jobWhere,
          _count: { _all: true }
        }), {
          message: "DeVoice dashboard counts lookup timed out."
        }).catch((error) => {
          warnDatabaseFallback("Falling back to local DeVoice dashboard counts because the database is unavailable", error);
          return [];
        }),
    getCreditState(session.user.id)
  ]);
  const jobs = [...localJobs, ...dbJobs].slice(0, 30);
  const credits = addLocalCreditsToState(creditState, localCredits);

  const countMap = new Map(dbCounts.map((item) => [item.status, item._count._all]));
  for (const job of localJobs) {
    countMap.set(job.status, (countMap.get(job.status) ?? 0) + 1);
  }
  const usedPercent = credits.totalEarnedCredits
    ? Math.min(100, Math.round((credits.usedCredits / credits.totalEarnedCredits) * 100))
    : 0;
  const totalCredits = credits.remainingCredits;
  const completed = countMap.get("completed") ?? 0;
  const failed = countMap.get("failed") ?? 0;
  const inProgress = (countMap.get("queued") ?? 0) + (countMap.get("processing") ?? 0);
  const href = (path = "") => localizedPath(locale, path);
  const quickTools = [
    [t.quickSpeechTitle, t.quickSpeechDescription, `${href()}#try`, FileAudio],
    [t.quickYoutubeTitle, t.quickYoutubeDescription, href("youtube-transcript-generator"), Youtube],
    [t.quickNoiseTitle, t.quickNoiseDescription, href("remove-background-noise"), Headphones],
    [t.quickTtsTitle, t.quickTtsDescription, href("text-to-speech"), MicVocal]
  ] as const;

  return (
    <DeVoiceShell locale={locale}>
      <main className="dashboardShell">
        <section className="resourcePage dashboardPage">
          <div className="resourceHeader dashboardHeader">
            <div>
              <h1>{t.title}</h1>
              <p>{t.description}</p>
            </div>
            <div className="dashboardHeaderActions">
              <span className="resourceRetention">{workspace.plan === "free" ? "Free User" : workspace.plan.toUpperCase()}</span>
              {workspace.stripeCustomerId ? (
                <BillingAction
                  locale={locale}
                  workspaceId={workspace.id}
                  mode="portal"
                  label={t.buyCredits}
                />
              ) : (
                <BillingAction
                  locale={locale}
                  workspaceId={workspace.id}
                  mode="checkout"
                  plan="pro"
                  label={t.buy}
                />
              )}
            </div>
          </div>

          <div className="dashboardAccountBar">
            <strong>
              <Gift size={16} aria-hidden="true" />
              {t.freeCredits} {credits.freeCredits}
            </strong>
            <span>{t.paidCredits} {credits.paidCredits}</span>
            <span>{workspace.subscriptionStatus}</span>
            <span>{credits.usedCredits} {t.creditsUsed}</span>
          </div>
          <div className="quotaTrack" aria-label={t.quotaUsage}>
            <span style={{ width: `${usedPercent}%` }} />
          </div>

          <div className="dashboardStats">
            <div className="stat">
              <strong>{totalCredits}</strong>
              <span>{t.creditsAvailable}</span>
            </div>
            <div className="stat">
              <strong>{completed}</strong>
              <span>{t.completed}</span>
            </div>
            <div className="stat">
              <strong>{inProgress}</strong>
              <span>{t.inProgress}</span>
            </div>
            <div className="stat">
              <strong>{failed}</strong>
              <span>{t.needsRetry}</span>
            </div>
          </div>

          <div className="dashboardProductGrid">
            <article className="creditsPanel">
              <div>
                <span className="sectionKicker">{dict.shell.credits}</span>
                <h2>{t.creditsTitle}</h2>
                <p>{t.creditsBody}</p>
              </div>
              <div className="creditMeter">
                <strong>{totalCredits}</strong>
                <span>{t.creditsLeft}</span>
              </div>
              <a className="mintButton" href={href("pricing")}>
                <Gift size={18} aria-hidden="true" />
                {t.claimNow}
              </a>
            </article>

            <article className="quickToolsPanel">
              <div className="tableHeader compactHeader">
                <h2>{t.quickTools}</h2>
                <a className="textLink" href={href()}>{t.viewAll}</a>
              </div>
              <div className="quickToolGrid">
                {quickTools.map(([title, description, href, Icon]) => (
                  <a href={href} key={title}>
                    <Icon size={22} aria-hidden="true" />
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                  </a>
                ))}
              </div>
            </article>
          </div>

          <div>
            <div className="tablePanel dashboardHistoryPanel">
              <div className="tableHeader">
                <h2>{t.history}</h2>
                <a className="btn btnPrimary" href={`${href()}#try`}>
                  <FileText size={18} aria-hidden="true" />
                  {t.openConverter}
                </a>
              </div>
              <div className="jobTable" role="table">
                <div className="jobRow jobHead" role="row">
                  <span>{t.fileLink}</span>
                  <span>{t.type}</span>
                  <span>{t.status}</span>
                  <span>{t.outputs}</span>
                  <span>{t.created}</span>
                </div>
                {jobs.length ? (
                  jobs.map((job) => (
                    <a className="jobRow" href={href(`jobs/${job.id}`)} key={job.id} role="row">
                      <span>
                        <FileText size={16} aria-hidden="true" />
                        {job.fileName ?? job.sourceUrl ?? job.sourceType}
                      </span>
                      <span>
                        {isYoutubeJob(job.sourceType) ? <Youtube size={16} aria-hidden="true" /> : <FileAudio size={16} aria-hidden="true" />}
                        {sourceTypeLabel(job.sourceType)}
                      </span>
                      <span>
                        <Gauge size={16} aria-hidden="true" />
                        {statusLabel(job.status)}
                      </span>
                      <span>
                        <Captions size={16} aria-hidden="true" />
                        TXT · SRT · JSON
                      </span>
                      <span>
                        <Clock3 size={16} aria-hidden="true" />
                        {formatDate(job.createdAt, locale)}
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="emptyState">
                    {t.emptyHistory}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboardProductGrid dashboardDownloadsGrid">
            <article className="downloadsPanel">
              <div className="tableHeader compactHeader">
                <h2>{t.recentExports}</h2>
                <a className="textLink" href={href("my-resources")}>{dict.shell.myResources}</a>
              </div>
              <div className="exportList">
                {(jobs.length ? jobs.slice(0, 4) : [{ id: "sample", fileName: "Sample transcript", sourceUrl: null, sourceType: "audio", status: "completed", createdAt: new Date() }]).map((job) => (
                  <a href={job.id === "sample" ? `${href()}#try` : href(`jobs/${job.id}`)} key={job.id}>
                    <PlayCircle size={18} aria-hidden="true" />
                    <span>{job.fileName ?? job.sourceUrl ?? `${job.sourceType} transcript`}</span>
                    <small>{statusLabel(job.status)}</small>
                  </a>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </DeVoiceShell>
  );
}
