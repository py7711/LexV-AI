import type { DeVoiceJobType } from "@/types/devoice-job";
import { parseSubtitleTarget } from "@/lib/devoice-subtitle-settings";

const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be"
]);

export function isYoutubeJobType(sourceType: DeVoiceJobType | string) {
  return sourceType === "youtube_transcript" || sourceType === "youtube_subtitle" || sourceType === "youtube_summary";
}

export function isYoutubeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    return youtubeHosts.has(hostname) || hostname.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

type CaptionTrack = {
  baseUrl: string;
  languageCode?: string;
  name?: { simpleText?: string; runs?: Array<{ text?: string }> };
  vssId?: string;
  kind?: string;
};

type CaptionCue = {
  startMs: number;
  durationMs: number;
  text: string;
};

export type YouTubeCaptionResult = {
  transcript: string;
  subtitles: string;
  summary: {
    summary: string;
    chapters: Array<{ title: string; startSec: number }>;
    keywords: string[];
  };
  translation: string;
  durationSec: number;
  provider: string;
};

type ExternalCue = {
  startMs: number;
  durationMs: number;
  text: string;
};

type ExternalTranscriptResponse = {
  transcript?: string;
  text?: string;
  subtitles?: string;
  srt?: string;
  durationSec?: number;
  duration?: number;
  language?: string;
  provider?: string;
  summary?: string | {
    summary?: string;
    chapters?: Array<{ title?: string; startSec?: number; start?: number }>;
    keywords?: string[];
  };
  chapters?: Array<{ title?: string; startSec?: number; start?: number }>;
  keywords?: string[];
  cues?: Array<{
    text?: string;
    startMs?: number;
    start_ms?: number;
    start?: number;
    durationMs?: number;
    duration_ms?: number;
    duration?: number;
  }>;
  segments?: Array<{
    text?: string;
    start?: number;
    end?: number;
    startMs?: number;
    endMs?: number;
  }>;
};

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: "\"",
    nbsp: " "
  };

  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return named[entity] ?? match;
  });
}

export function extractYouTubeVideoId(value: string) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (!youtubeHosts.has(hostname) && !hostname.endsWith(".youtube.com")) {
      return null;
    }

    if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/").filter(Boolean)[1] ?? null;
    }

    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

function findBalancedJson(text: string, marker: string) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = text.indexOf("{", markerIndex + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return null;
}

function getCaptionTracksFromWatchHtml(html: string): CaptionTrack[] {
  const candidates = [
    findBalancedJson(html, "ytInitialPlayerResponse ="),
    findBalancedJson(html, "var ytInitialPlayerResponse ="),
    findBalancedJson(html, "window[\"ytInitialPlayerResponse\"] =")
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks?: CaptionTrack[];
          };
        };
      };
      const tracks = parsed.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks?.length) return tracks;
    } catch {
      // Try the next candidate.
    }
  }

  return [];
}

function requestedLanguageFromTarget(value?: string | null) {
  const parsed = parseSubtitleTarget(value);
  return parsed.language.toLowerCase();
}

function trackLabel(track: CaptionTrack) {
  if (track.name?.simpleText) return track.name.simpleText;
  return track.name?.runs?.map((run) => run.text).filter(Boolean).join("") ?? "";
}

function orderCaptionTracks(tracks: CaptionTrack[], requestedLanguage: string) {
  const normalizedRequested = requestedLanguage.toLowerCase();
  const languageMatches = tracks.filter((track) => track.languageCode?.toLowerCase().startsWith(normalizedRequested));
  const english = tracks.filter((track) => track.languageCode?.toLowerCase().startsWith("en") || track.vssId?.includes(".en"));
  const ordered = [
    ...languageMatches.filter((track) => track.kind !== "asr"),
    ...languageMatches.filter((track) => track.kind === "asr"),
    ...english.filter((track) => track.kind !== "asr"),
    ...english.filter((track) => track.kind === "asr"),
    ...tracks.filter((track) => track.kind !== "asr"),
    ...tracks
  ];
  const seen = new Set<string>();

  return ordered.filter((track) => {
    if (!track.baseUrl || seen.has(track.baseUrl)) return false;
    seen.add(track.baseUrl);
    return true;
  });
}

function captionUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("fmt", "json3");
  return url.toString();
}

function captionUrlCandidates(baseUrl: string) {
  const srv3Url = new URL(baseUrl);
  srv3Url.searchParams.set("fmt", "srv3");
  return [captionUrl(baseUrl), srv3Url.toString(), baseUrl];
}

function cuesFromJson3(value: unknown): CaptionCue[] {
  if (!value || typeof value !== "object") return [];
  const events = (value as { events?: unknown[] }).events;
  if (!Array.isArray(events)) return [];

  return events.flatMap((event) => {
    if (!event || typeof event !== "object") return [];
    const data = event as { tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> };
    const text = data.segs?.map((seg) => seg.utf8 ?? "").join("").replace(/\s+/g, " ").trim();
    if (!text) return [];

    return [{
      startMs: data.tStartMs ?? 0,
      durationMs: data.dDurationMs ?? 2500,
      text
    }];
  });
}

function cuesFromXml(xml: string): CaptionCue[] {
  return [...xml.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].flatMap((match) => {
    const attrs = match[1] ?? "";
    const start = Number(attrs.match(/\bstart="([^"]+)"/)?.[1] ?? 0);
    const duration = Number(attrs.match(/\bdur="([^"]+)"/)?.[1] ?? 2.5);
    const text = decodeHtmlEntities((match[2] ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) return [];
    return [{ startMs: Math.round(start * 1000), durationMs: Math.round(duration * 1000), text }];
  });
}

function normalizeTranscript(cues: CaptionCue[]) {
  const lines: string[] = [];
  for (const cue of cues) {
    const text = cue.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (lines[lines.length - 1] === text) continue;
    lines.push(text);
  }
  return lines.join(" ");
}

function srtTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.max(0, ms % 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function buildSrt(cues: CaptionCue[]) {
  return cues
    .map((cue, index) => {
      const endMs = cue.startMs + Math.max(cue.durationMs, 1000);
      return `${index + 1}\n${srtTime(cue.startMs)} --> ${srtTime(endMs)}\n${cue.text}`;
    })
    .join("\n\n");
}

function sentenceSummary(transcript: string) {
  const sentences = transcript.match(/[^.!?。！？]+[.!?。！？]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
  return sentences.slice(0, 4).join(" ") || transcript.slice(0, 500);
}

function keywordsFromTranscript(transcript: string) {
  const stop = new Set(["about", "after", "again", "also", "and", "are", "because", "been", "but", "can", "for", "from", "have", "into", "that", "the", "this", "with", "you", "your"]);
  const counts = new Map<string, number>();
  for (const match of transcript.toLowerCase().matchAll(/\b[a-z][a-z0-9-]{3,}\b/g)) {
    const word = match[0];
    if (stop.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function chaptersFromCues(cues: CaptionCue[]) {
  if (!cues.length) return [];
  const chapterCount = Math.min(5, Math.max(1, Math.ceil(cues.length / 18)));
  const step = Math.max(1, Math.floor(cues.length / chapterCount));
  const chapters: Array<{ title: string; startSec: number }> = [];

  for (let index = 0; index < cues.length && chapters.length < chapterCount; index += step) {
    const cue = cues[index];
    chapters.push({
      title: cue.text.slice(0, 72),
      startSec: Math.floor(cue.startMs / 1000)
    });
  }

  return chapters;
}

export function hasExternalYouTubeTranscriptProvider() {
  return Boolean(process.env.YOUTUBE_TRANSCRIPT_API_URL?.trim());
}

function externalHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  const token = process.env.YOUTUBE_TRANSCRIPT_API_KEY?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const headerName = process.env.YOUTUBE_TRANSCRIPT_API_KEY_HEADER?.trim();
  if (token && headerName) {
    headers[headerName] = token;
  }
  return headers;
}

function normalizeExternalCue(item: NonNullable<ExternalTranscriptResponse["cues"]>[number]): ExternalCue | null {
  const text = item.text?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  const start = item.startMs ?? item.start_ms ?? item.start ?? 0;
  const duration = item.durationMs ?? item.duration_ms ?? item.duration ?? 2500;
  return {
    text,
    startMs: start > 10000 ? Math.round(start) : Math.round(start * 1000),
    durationMs: duration > 10000 ? Math.round(duration) : Math.round(duration * 1000)
  };
}

function normalizeExternalSegment(item: NonNullable<ExternalTranscriptResponse["segments"]>[number]): ExternalCue | null {
  const text = item.text?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  const start = item.startMs ?? (typeof item.start === "number" ? item.start * 1000 : 0);
  const end = item.endMs ?? (typeof item.end === "number" ? item.end * 1000 : start + 2500);
  return {
    text,
    startMs: Math.round(start),
    durationMs: Math.max(1000, Math.round(end - start))
  };
}

function externalCues(data: ExternalTranscriptResponse): CaptionCue[] {
  const cues = data.cues?.flatMap((cue) => {
    const normalized = normalizeExternalCue(cue);
    return normalized ? [normalized] : [];
  }) ?? [];
  if (cues.length) return cues;

  return data.segments?.flatMap((segment) => {
    const normalized = normalizeExternalSegment(segment);
    return normalized ? [normalized] : [];
  }) ?? [];
}

function normalizeExternalSummary(data: ExternalTranscriptResponse, transcript: string, cues: CaptionCue[]) {
  if (data.summary && typeof data.summary === "object") {
    return {
      summary: data.summary.summary ?? sentenceSummary(transcript),
      chapters: (data.summary.chapters ?? []).flatMap((chapter) => {
        if (!chapter.title) return [];
        return [{ title: chapter.title, startSec: chapter.startSec ?? chapter.start ?? 0 }];
      }),
      keywords: data.summary.keywords ?? keywordsFromTranscript(transcript)
    };
  }

  return {
    summary: typeof data.summary === "string" ? data.summary : sentenceSummary(transcript),
    chapters: (data.chapters ?? []).flatMap((chapter) => {
      if (!chapter.title) return [];
      return [{ title: chapter.title, startSec: chapter.startSec ?? chapter.start ?? 0 }];
    }).slice(0, 6),
    keywords: data.keywords ?? keywordsFromTranscript(transcript)
  };
}

function externalEndpointUrl(endpoint: string, input: {
  sourceUrl: string;
  videoId: string;
  targetLanguage?: string | null;
  sourceType?: DeVoiceJobType | string;
}) {
  if (process.env.YOUTUBE_TRANSCRIPT_API_METHOD?.toUpperCase() !== "GET") {
    return endpoint;
  }

  const url = new URL(endpoint);
  url.searchParams.set("url", input.sourceUrl);
  url.searchParams.set("videoId", input.videoId);
  url.searchParams.set("language", requestedLanguageFromTarget(input.targetLanguage));
  if (input.sourceType) {
    url.searchParams.set("sourceType", input.sourceType);
  }
  return url.toString();
}

export async function fetchExternalYouTubeTranscriptResult(input: {
  sourceUrl: string;
  targetLanguage?: string | null;
  sourceType?: DeVoiceJobType | string;
}): Promise<YouTubeCaptionResult> {
  const endpoint = process.env.YOUTUBE_TRANSCRIPT_API_URL?.trim();
  if (!endpoint) {
    throw new Error("YOUTUBE_TRANSCRIPT_API_URL is not configured.");
  }

  const videoId = extractYouTubeVideoId(input.sourceUrl);
  if (!videoId) {
    throw new Error("Unable to extract a YouTube video id.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.YOUTUBE_TRANSCRIPT_TIMEOUT_MS ?? 120000));

  try {
    const response = await fetch(externalEndpointUrl(endpoint, { ...input, videoId }), {
      method: process.env.YOUTUBE_TRANSCRIPT_API_METHOD?.toUpperCase() === "GET" ? "GET" : "POST",
      headers: externalHeaders(),
      body: process.env.YOUTUBE_TRANSCRIPT_API_METHOD?.toUpperCase() === "GET"
        ? undefined
        : JSON.stringify({
            url: input.sourceUrl,
            videoId,
            language: requestedLanguageFromTarget(input.targetLanguage),
            sourceType: input.sourceType
          }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`External YouTube transcript provider HTTP ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as ExternalTranscriptResponse;
    const cues = externalCues(data);
    const transcript = (data.transcript ?? data.text ?? normalizeTranscript(cues)).replace(/\s+/g, " ").trim();
    if (!transcript) {
      throw new Error("External YouTube transcript provider returned an empty transcript.");
    }

    const subtitles = data.srt ?? data.subtitles ?? (cues.length ? buildSrt(cues) : buildSrt([{ startMs: 0, durationMs: 4000, text: transcript.slice(0, 220) }]));
    const durationSec = Math.ceil(data.durationSec ?? data.duration ?? (cues.length ? Math.max(...cues.map((cue) => cue.startMs + cue.durationMs)) / 1000 : 30));
    const summary = normalizeExternalSummary(data, transcript, cues);

    return {
      transcript,
      subtitles,
      summary: {
        summary: summary.summary,
        chapters: summary.chapters.length ? summary.chapters : chaptersFromCues(cues),
        keywords: summary.keywords
      },
      translation: input.targetLanguage ? `[${input.targetLanguage}] ${transcript}` : "",
      durationSec,
      provider: data.provider ?? `External YouTube transcript provider${data.language ? ` (${data.language})` : ""}`
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchYouTubeCaptionResult(input: {
  sourceUrl: string;
  targetLanguage?: string | null;
  sourceType?: DeVoiceJobType | string;
}): Promise<YouTubeCaptionResult> {
  const videoId = extractYouTubeVideoId(input.sourceUrl);
  if (!videoId) {
    throw new Error("Unable to extract a YouTube video id.");
  }

  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const watchResponse = await fetch(watchUrl, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 DeVoiceClone/1.0"
    }
  });

  if (!watchResponse.ok) {
    throw new Error(`YouTube watch page returned HTTP ${watchResponse.status}.`);
  }

  const html = await watchResponse.text();
  const tracks = getCaptionTracksFromWatchHtml(html);
  if (!tracks.length) {
    throw new Error("No YouTube caption tracks are available for this video.");
  }

  const requestedLanguage = requestedLanguageFromTarget(input.targetLanguage);
  const orderedTracks = orderCaptionTracks(tracks, requestedLanguage);
  if (!orderedTracks.length) {
    throw new Error("No usable YouTube caption track was found.");
  }

  let cues: CaptionCue[] = [];
  let lastStatus = "";
  let usedTrack: CaptionTrack | null = null;

  for (const track of orderedTracks) {
    for (const url of captionUrlCandidates(track.baseUrl)) {
      const captionsResponse = await fetch(url, {
        headers: {
          "accept-language": "en-US,en;q=0.9",
          "user-agent": "Mozilla/5.0 DeVoiceClone/1.0"
        }
      });

      if (!captionsResponse.ok) {
        lastStatus = `HTTP ${captionsResponse.status}`;
        continue;
      }

      const captionBody = await captionsResponse.text();
      try {
        cues = cuesFromJson3(JSON.parse(captionBody));
      } catch {
        cues = cuesFromXml(captionBody);
      }

      if (cues.length) {
        usedTrack = track;
        break;
      }
      lastStatus = "empty caption response";
    }

    if (cues.length) break;
  }

  if (!cues.length) {
    throw new Error(`The selected YouTube caption track was empty${lastStatus ? ` (${lastStatus})` : ""}.`);
  }

  const transcript = normalizeTranscript(cues);
  const subtitles = buildSrt(cues);
  const durationSec = Math.ceil(Math.max(...cues.map((cue) => cue.startMs + cue.durationMs)) / 1000);
  const label = usedTrack ? trackLabel(usedTrack) || usedTrack.languageCode || "captions" : "captions";

  return {
    transcript,
    subtitles,
    summary: {
      summary: sentenceSummary(transcript),
      chapters: chaptersFromCues(cues),
      keywords: keywordsFromTranscript(transcript)
    },
    translation: input.targetLanguage ? `[${input.targetLanguage}] ${transcript}` : "",
    durationSec,
    provider: `YouTube captions (${label})`
  };
}
