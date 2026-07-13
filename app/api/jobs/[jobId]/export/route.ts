import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { buildCleanedNoiseReductionWav, buildDeVoicePreviewMp3, buildDeVoicePreviewWav, convertAudioBytes, extractAudioFromMedia } from "@/lib/devoice-audio-preview";
import { parseSubtitleTarget } from "@/lib/devoice-subtitle-settings";
import { buildOpenAiSpeechAudio, hasOpenAiSpeechProvider } from "@/lib/devoice-tts-provider";
import { buildElevenLabsIsolatedAudio, hasElevenLabsAudioIsolationProvider } from "@/lib/elevenlabs-audio-isolation";
import { getVoiceLabel, getVoiceLanguageLabel } from "@/lib/devoice-voice-settings";
import { getLocalMediaObject, isLocalMediaStorageKey } from "@/lib/local-media-store";
import { localJobById, readLocalJobsFromCookieHeader } from "@/lib/local-jobs";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/r2";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

function downloadResponse(body: string, fileName: string, contentType: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}

function binaryDownloadResponse(body: Uint8Array, fileName: string, contentType: string) {
  const copy = new ArrayBuffer(body.byteLength);
  new Uint8Array(copy).set(body);
  return new NextResponse(copy, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}

function srtToVtt(srt: string) {
  const normalized = srt.trim() ? srt.trim() : "1\n00:00:00,000 --> 00:00:04,000\nDeVoice result is not ready yet.";
  return `WEBVTT\n\n${normalized.replaceAll(",", ".")}\n`;
}

function srtToPlainText(srt: string) {
  const normalized = srt.trim();
  if (!normalized) return "DeVoice subtitles are not ready yet.";

  return normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\d+$/.test(line) && !line.includes("-->"))
    .join("\n");
}

function plainText(value: string | null, fallback: string) {
  return value?.trim() ? value : fallback;
}

function sourceContentType(job: { fileName: string | null; sourceUrl: string | null; storageKey: string | null }) {
  const value = `${job.fileName ?? ""} ${job.sourceUrl ?? ""} ${job.storageKey ?? ""}`.toLowerCase();
  if (value.includes(".wav")) return "audio/wav";
  if (value.includes(".m4a")) return "audio/mp4";
  if (value.includes(".webm")) return "video/webm";
  if (value.includes(".mp4")) return "video/mp4";
  if (value.includes(".mov")) return "video/quicktime";
  if (value.includes(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}

function readableSummary(value: string | null) {
  if (!value?.trim()) return "Summary is not ready yet.";

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const lines = [String(parsed.summary ?? parsed.overview ?? "").trim()].filter(Boolean);

    if (Array.isArray(parsed.chapters) && parsed.chapters.length) {
      lines.push("", "Chapters:");
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
      lines.push("", `Keywords: ${parsed.keywords.map((item) => String(item)).join(", ")}`);
    }

    return lines.length ? lines.join("\n") : value;
  } catch {
    return value;
  }
}

function sourceTextForAudio(job: { sourceUrl: string | null; transcript: string | null; fileName: string | null; id: string }) {
  if (job.sourceUrl?.startsWith("data:text/plain,")) {
    try {
      return decodeURIComponent(job.sourceUrl.replace(/^data:text\/plain,?/i, ""));
    } catch {
      return job.sourceUrl.replace(/^data:text\/plain,?/i, "");
    }
  }

  return job.transcript ?? job.fileName ?? job.id;
}

function persistedAudioArtifact(job: { fallbackTrail?: unknown }, format: "mp3") {
  const trail = Array.isArray(job.fallbackTrail) ? job.fallbackTrail : [];

  for (const item of trail) {
    if (!item || typeof item !== "object") continue;
    const artifact = (item as { persistedArtifact?: unknown }).persistedArtifact;
    if (!artifact || typeof artifact !== "object") continue;
    const record = artifact as Record<string, unknown>;
    if (record.format !== format || typeof record.storageKey !== "string") continue;
    return {
      storageKey: record.storageKey,
      publicUrl: typeof record.publicUrl === "string" ? record.publicUrl : null
    };
  }

  return null;
}

async function redirectToPersistedArtifact(job: { fallbackTrail?: unknown }, format: "mp3") {
  const artifact = persistedAudioArtifact(job, format);
  if (!artifact) return null;

  try {
    const url = artifact.publicUrl ?? await createDownloadUrl(artifact.storageKey);
    return NextResponse.redirect(url);
  } catch (error) {
    console.warn("Unable to create persisted DeVoice audio artifact URL; falling back to generated export.", error);
    return null;
  }
}

async function buildNoiseProviderExport(
  job: {
    sourceUrl: string | null;
    storageKey: string | null;
    fileName: string | null;
  },
  format: "mp3" | "wav"
) {
  if (!hasElevenLabsAudioIsolationProvider()) return null;

  try {
    const result = await buildElevenLabsIsolatedAudio({
      sourceUrl: job.sourceUrl,
      storageKey: job.storageKey,
      fileName: job.fileName
    });

    if (format === "mp3") {
      return {
        body: result.audio,
        contentType: "audio/mpeg"
      };
    }

    return {
      body: await convertAudioBytes({
        bytes: result.audio,
        inputFileName: "isolated.mp3",
        outputFileName: "isolated.wav",
        args: ["-vn", "-ac", "1", "-ar", "44100"]
      }),
      contentType: "audio/wav"
    };
  } catch (error) {
    console.warn("ElevenLabs Audio Isolation export failed; falling back to local DeVoice cleanup.", error);
    return null;
  }
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice before exporting results." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const localJob = localJobById(readLocalJobsFromCookieHeader(request.headers.get("cookie")), session.user.id, jobId);
  if (localJob) {
    return exportJob(localJob, format);
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
        message: "DeVoice job export lookup timed out."
      });
    } catch (error) {
      console.warn("Unable to read DeVoice job for export from database.", error);
      job = null;
    }
  }

  if (!job) {
    return NextResponse.json({ error: "This resource does not exist or cannot be accessed." }, { status: 404 });
  }

  return exportJob(job, format);
}

async function exportJob(
  job: {
    id: string;
    sourceType: string;
    sourceUrl: string | null;
    storageKey: string | null;
    fileName: string | null;
    language: string | null;
    targetLanguage: string | null;
    status: string;
    provider: string | null;
    fallbackTrail?: unknown;
    transcript: string | null;
    subtitles: string | null;
    summary: string | null;
    translation: string | null;
  },
  format: string
) {
  if (format === "srt") {
    return downloadResponse(plainText(job.subtitles, ""), `devoice-${job.id}.srt`, "text/plain");
  }

  if (format === "vtt") {
    return downloadResponse(srtToVtt(job.subtitles ?? ""), `devoice-${job.id}.vtt`, "text/vtt");
  }

  if (format === "transcript") {
    return downloadResponse(plainText(job.transcript, "Transcript is not ready yet."), `devoice-${job.id}-transcript.txt`, "text/plain");
  }

  if (format === "summary") {
    return downloadResponse(readableSummary(job.summary), `devoice-${job.id}-summary.txt`, "text/plain");
  }

  if (format === "translation") {
    return downloadResponse(plainText(job.translation, "Translation is not ready yet."), `devoice-${job.id}-translation.txt`, "text/plain");
  }

  if (format === "source") {
    if (job.storageKey && isLocalMediaStorageKey(job.storageKey)) {
      try {
        const object = await getLocalMediaObject({ storageKey: job.storageKey });
        return binaryDownloadResponse(object.body, job.fileName ?? `devoice-${job.id}-source`, sourceContentType(job));
      } catch (error) {
        console.warn("Local DeVoice source media is not available; falling back to generated preview audio.", error);
      }
    }

    if (job.sourceUrl?.startsWith("http://") || job.sourceUrl?.startsWith("https://")) {
      return NextResponse.redirect(job.sourceUrl);
    }

    if (job.storageKey && !isLocalMediaStorageKey(job.storageKey)) {
      try {
        return NextResponse.redirect(await createDownloadUrl(job.storageKey));
      } catch (error) {
        console.warn("Unable to create source media download URL; falling back to generated preview audio.", error);
      }
    }

    return binaryDownloadResponse(
      buildDeVoicePreviewWav({
        kind: "text_to_speech",
        text: sourceTextForAudio(job),
        seed: job.storageKey ?? job.sourceUrl ?? job.id
      }),
      `devoice-${job.id}-source-preview.wav`,
      "audio/wav"
    );
  }

  if (format === "wav" || format === "mp3") {
    if (job.sourceType !== "text_to_speech" && job.sourceType !== "voice_clone" && job.sourceType !== "ai_dubbing" && job.sourceType !== "ai_music" && job.sourceType !== "ai_rap" && job.sourceType !== "remove_noise" && job.sourceType !== "voice_enhance" && job.sourceType !== "voice_change" && job.sourceType !== "audio_extract") {
      return NextResponse.json({ error: "Audio preview is only available for voice, noise-removal, voice-enhancement, voice-changer and audio-extraction resources." }, { status: 400 });
    }
    const previewOptions = {
      kind: job.sourceType as "text_to_speech" | "voice_clone" | "ai_dubbing" | "ai_music" | "ai_rap" | "remove_noise" | "voice_enhance" | "voice_change" | "audio_extract",
      text: sourceTextForAudio(job),
      voiceId: job.targetLanguage,
      seed: job.storageKey ?? job.fileName ?? job.id
    };

    if (format === "mp3") {
      if (job.sourceType === "audio_extract") {
        try {
          return binaryDownloadResponse(
            await extractAudioFromMedia({
              sourceUrl: job.sourceUrl,
              storageKey: job.storageKey,
              fileName: job.fileName,
              format: "mp3"
            }),
            `devoice-${job.id}-audio.mp3`,
            "audio/mpeg"
          );
        } catch (error) {
          console.warn("Unable to extract MP3 audio from source media; falling back to DeVoice preview MP3.", error);
        }
      }

      if (job.sourceType === "remove_noise" || job.sourceType === "voice_enhance" || job.sourceType === "voice_change") {
        const persisted = await redirectToPersistedArtifact(job, "mp3");
        if (persisted) return persisted;
        const isolated = await buildNoiseProviderExport(job, "mp3");
        if (isolated) return binaryDownloadResponse(isolated.body, `devoice-${job.id}-${job.sourceType === "voice_enhance" ? "enhanced-voice" : job.sourceType === "voice_change" ? "changed-voice" : "clean"}.mp3`, isolated.contentType);

        try {
          return binaryDownloadResponse(await buildDeVoicePreviewMp3(previewOptions), `devoice-${job.id}-${job.sourceType === "voice_enhance" ? "enhanced-voice" : job.sourceType === "voice_change" ? "changed-voice" : "clean"}.mp3`, "audio/mpeg");
        } catch (error) {
          console.warn("Unable to export DeVoice MP3 preview.", error);
          return NextResponse.json(
            { error: "MP3 export requires ffmpeg to be available on the server." },
            { status: 503 }
          );
        }
      }
      const persisted = await redirectToPersistedArtifact(job, "mp3");
      if (persisted) return persisted;

      if (hasOpenAiSpeechProvider()) {
        try {
          return binaryDownloadResponse(
            await buildOpenAiSpeechAudio({
              text: previewOptions.text,
              voiceId: previewOptions.voiceId,
              format: "mp3"
            }),
            `devoice-${job.id}.mp3`,
            "audio/mpeg"
          );
        } catch (error) {
          console.warn("OpenAI speech MP3 export failed; falling back to DeVoice preview MP3.", error);
        }
      }
      try {
        return binaryDownloadResponse(await buildDeVoicePreviewMp3(previewOptions), `devoice-${job.id}.mp3`, "audio/mpeg");
      } catch (error) {
        console.warn("Unable to export DeVoice MP3 preview.", error);
        return NextResponse.json(
          { error: "MP3 export requires ffmpeg to be available on the server." },
          { status: 503 }
        );
      }
    }

    if (job.sourceType === "audio_extract") {
      try {
        return binaryDownloadResponse(
          await extractAudioFromMedia({
            sourceUrl: job.sourceUrl,
            storageKey: job.storageKey,
            fileName: job.fileName,
            format: "wav"
          }),
          `devoice-${job.id}-audio.wav`,
          "audio/wav"
        );
      } catch (error) {
        console.warn("Unable to extract WAV audio from source media; falling back to DeVoice WAV preview.", error);
      }
    }

    if (job.sourceType === "remove_noise" || job.sourceType === "voice_enhance" || job.sourceType === "voice_change") {
      const isolated = await buildNoiseProviderExport(job, "wav");
      if (isolated) return binaryDownloadResponse(isolated.body, `devoice-${job.id}-${job.sourceType === "voice_enhance" ? "enhanced-voice" : job.sourceType === "voice_change" ? "changed-voice" : "clean"}.wav`, isolated.contentType);

      if (job.sourceType !== "voice_change") {
        try {
          return binaryDownloadResponse(
            await buildCleanedNoiseReductionWav({
              sourceUrl: job.sourceUrl,
              storageKey: job.storageKey,
              fileName: job.fileName
            }),
            `devoice-${job.id}-${job.sourceType === "voice_enhance" ? "enhanced-voice" : "clean"}.wav`,
            "audio/wav"
          );
        } catch (error) {
          console.warn("Unable to export cleaned source audio; falling back to DeVoice WAV preview.", error);
        }
      }
    }

    if (job.sourceType === "text_to_speech" || job.sourceType === "voice_clone" || job.sourceType === "ai_dubbing") {
      if (hasOpenAiSpeechProvider()) {
        try {
          return binaryDownloadResponse(
            await buildOpenAiSpeechAudio({
              text: previewOptions.text,
              voiceId: previewOptions.voiceId,
              format: "wav"
            }),
            `devoice-${job.id}.wav`,
            "audio/wav"
          );
        } catch (error) {
          console.warn("OpenAI speech WAV export failed; falling back to DeVoice preview WAV.", error);
        }
      }
    }

    return binaryDownloadResponse(buildDeVoicePreviewWav(previewOptions), `devoice-${job.id}.wav`, "audio/wav");
  }

  if (format === "txt") {
    if (job.sourceType === "youtube_subtitle") {
      const subtitleSettings = parseSubtitleTarget(job.targetLanguage);
      return downloadResponse(
        srtToPlainText(job.subtitles ?? ""),
        `devoice-${job.id}-${subtitleSettings.language.toLowerCase()}-subtitles.txt`,
        "text/plain"
      );
    }

    const isVoiceJob = job.sourceType === "text_to_speech" || job.sourceType === "voice_clone" || job.sourceType === "ai_dubbing";
    const text = [
      `DeVoice Job: ${job.id}`,
      `Status: ${job.status}`,
      `Provider: ${job.provider ?? "-"}`,
      `Language: ${isVoiceJob ? getVoiceLanguageLabel(job.language) : job.language ?? "-"}`,
      `Voice / Target: ${isVoiceJob ? getVoiceLabel(job.targetLanguage) : job.targetLanguage ?? "-"}`,
      "",
      "Transcript:",
      job.transcript ?? "",
      "",
      "Summary:",
      readableSummary(job.summary),
      "",
      "Translation:",
      job.translation ?? ""
    ].join("\n");
    return downloadResponse(text, `devoice-${job.id}.txt`, "text/plain");
  }

  return downloadResponse(JSON.stringify(job, null, 2), `devoice-${job.id}.json`, "application/json");
}
