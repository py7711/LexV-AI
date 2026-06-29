import { buildDemoResult, type DemoMediaJob } from "@/lib/devoice-demo-processing";
import type { DeVoiceJobType } from "@/types/devoice-job";

export const localJobsCookieName = "devoice_local_jobs";

export type LocalJob = {
  id: string;
  userId: string;
  workspaceId: string;
  sourceType: DeVoiceJobType | string;
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
  createdAt: string;
  updatedAt: string;
};

type LocalJobInput = {
  userId: string;
  workspaceId: string;
  sourceType: DeVoiceJobType | string;
  sourceUrl?: string;
  storageKey?: string;
  fileName?: string;
  language?: string;
  targetLanguage?: string;
  costCents: number;
};

const maxJobs = 6;
const maxCookieLength = 3600;

// 本地演示任务存放在 httpOnly cookie 中。这里用 base64url 包一层，
// 避免 JSON 中的引号、逗号和换行影响 Cookie 解析。
function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function normalizeJob(value: unknown): LocalJob | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LocalJob>;
  if (!item.id || !item.userId || !item.sourceType || !item.createdAt || !item.updatedAt) return null;

  return {
    id: String(item.id),
    userId: String(item.userId),
    workspaceId: String(item.workspaceId ?? `local-${item.userId}`),
    sourceType: String(item.sourceType),
    sourceUrl: item.sourceUrl ? String(item.sourceUrl) : null,
    storageKey: item.storageKey ? String(item.storageKey) : null,
    fileName: item.fileName ? String(item.fileName) : null,
    language: item.language ? String(item.language) : null,
    targetLanguage: item.targetLanguage ? String(item.targetLanguage) : null,
    status: String(item.status ?? "completed"),
    provider: item.provider ? String(item.provider) : null,
    errorMessage: item.errorMessage ? String(item.errorMessage) : null,
    transcript: item.transcript ? String(item.transcript) : null,
    subtitles: item.subtitles ? String(item.subtitles) : null,
    summary: item.summary ? String(item.summary) : null,
    translation: item.translation ? String(item.translation) : null,
    durationSec: typeof item.durationSec === "number" ? item.durationSec : null,
    costCents: typeof item.costCents === "number" ? item.costCents : 0,
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt)
  };
}

export function parseLocalJobs(value?: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(base64UrlDecode(value)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const job = normalizeJob(item);
      return job ? [job] : [];
    });
  } catch {
    return [];
  }
}

export function readLocalJobsFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) return [];

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${localJobsCookieName}=`));

  if (!cookie) return [];
  return parseLocalJobs(decodeURIComponent(cookie.slice(localJobsCookieName.length + 1)));
}

export function serializeLocalJobs(jobs: LocalJob[]) {
  let nextJobs = jobs.slice(0, maxJobs);
  let serialized = base64UrlEncode(JSON.stringify(nextJobs));

  // 浏览器单个 Cookie 通常限制约 4KB；超限时优先保留最新任务。
  while (serialized.length > maxCookieLength && nextJobs.length > 1) {
    nextJobs = nextJobs.slice(0, -1);
    serialized = base64UrlEncode(JSON.stringify(nextJobs));
  }

  return serialized;
}

export function createLocalJob(input: LocalJobInput): LocalJob {
  const now = new Date().toISOString();
  const demoJob: DemoMediaJob = {
    id: `local-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? null,
    storageKey: input.storageKey ?? null,
    fileName: input.fileName ?? null,
    language: input.language ?? null,
    targetLanguage: input.targetLanguage ?? null
  };
  const result = buildDemoResult(demoJob);

  return {
    ...demoJob,
    userId: input.userId,
    workspaceId: input.workspaceId,
    status: "completed",
    provider: result.provider,
    errorMessage: null,
    transcript: result.transcript,
    subtitles: result.subtitles,
    summary: JSON.stringify(result.summary),
    translation: result.translation,
    durationSec: 30,
    costCents: input.costCents,
    createdAt: now,
    updatedAt: now
  };
}

export function visibleLocalJobs(jobs: LocalJob[], userId: string) {
  return jobs.filter((job) => job.userId === userId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function localJobById(jobs: LocalJob[], userId: string, jobId: string) {
  return visibleLocalJobs(jobs, userId).find((job) => job.id === jobId) ?? null;
}

export function prependLocalJob(jobs: LocalJob[], job: LocalJob) {
  return [job, ...jobs.filter((item) => item.id !== job.id)].slice(0, maxJobs);
}

export function removeLocalJob(jobs: LocalJob[], userId: string, jobId: string) {
  return jobs.filter((job) => !(job.userId === userId && job.id === jobId));
}

export function updateLocalJob(jobs: LocalJob[], userId: string, jobId: string, patch: Partial<LocalJob>) {
  const now = new Date().toISOString();
  return jobs.map((job) => {
    if (job.userId !== userId || job.id !== jobId) return job;
    return {
      ...job,
      ...patch,
      id: job.id,
      userId: job.userId,
      createdAt: job.createdAt,
      updatedAt: now
    };
  });
}

export function localJobDates(job: LocalJob) {
  return {
    ...job,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt)
  };
}
