import { buildDemoResult } from "@/lib/devoice-demo-processing";
import { buildElevenLabsIsolatedAudio, hasElevenLabsAudioIsolationProvider } from "@/lib/elevenlabs-audio-isolation";
import { prisma } from "@/lib/prisma";
import { hasR2Config, putObject } from "@/lib/r2";
import type { Prisma } from "@prisma/client";

type MediaJob = NonNullable<Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>>;

type PersistedNoiseArtifact = {
  format: "mp3";
  contentType: "audio/mpeg";
  storageKey: string;
  publicUrl?: string;
  bytes: number;
};

function withoutUndefined(value: Record<string, unknown>): Prisma.JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Prisma.JsonObject;
}

function generatedArtifactKey(job: MediaJob) {
  const workspace = job.workspaceId ?? job.userId ?? "personal";
  const safeId = job.id.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `generated/${workspace}/${safeId}/${job.sourceType === "voice_enhance" ? "enhanced-voice" : job.sourceType === "voice_change" ? "changed-voice" : "clean"}.mp3`;
}

async function persistNoiseArtifact(job: MediaJob, audio: Uint8Array): Promise<PersistedNoiseArtifact | null> {
  if (!hasR2Config()) return null;

  try {
    const uploaded = await putObject({
      storageKey: generatedArtifactKey(job),
      contentType: "audio/mpeg",
      body: audio
    });

    return {
      format: "mp3",
      contentType: "audio/mpeg",
      storageKey: uploaded.storageKey,
      publicUrl: uploaded.publicUrl,
      bytes: audio.byteLength
    };
  } catch (error) {
    console.warn("Audio isolation succeeded, but DeVoice could not persist the cleaned MP3 artifact.", error);
    return null;
  }
}

export function shouldUseNoiseProviderForJob(sourceType: string) {
  return (sourceType === "remove_noise" || sourceType === "voice_enhance" || sourceType === "voice_change") && hasElevenLabsAudioIsolationProvider();
}

export async function completeNoiseJobWithProviderResult(jobId: string) {
  const job = await prisma.mediaJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("Media job does not exist.");
  }

  if ((job.sourceType !== "remove_noise" && job.sourceType !== "voice_enhance" && job.sourceType !== "voice_change") || !hasElevenLabsAudioIsolationProvider()) {
    const fallback = buildDemoResult(job);
    return prisma.mediaJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        provider: fallback.provider,
        fallbackTrail: [
          withoutUndefined({
            provider: fallback.provider,
            status: "success",
            mode: "inline-demo",
            artifacts: ["result-record", "wav-preview"]
          })
        ],
        transcript: fallback.transcript,
        subtitles: fallback.subtitles,
        summary: JSON.stringify(fallback.summary),
        translation: fallback.translation,
        durationSec: 30
      }
    });
  }

  try {
    const isolated = await buildElevenLabsIsolatedAudio({
      sourceUrl: job.sourceUrl,
      storageKey: job.storageKey,
      fileName: job.fileName
    });
    const artifact = await persistNoiseArtifact(job, isolated.audio);
    const isVoiceEnhance = job.sourceType === "voice_enhance";
    const isVoiceChange = job.sourceType === "voice_change";
    const artifacts = artifact ? ["provider-audio-isolation", "persisted-mp3", "export-time-wav"] : ["provider-audio-isolation", "export-time-mp3", "export-time-wav"];

    return prisma.mediaJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        provider: isolated.provider,
        fallbackTrail: [
          withoutUndefined({
            provider: isolated.provider,
            status: "success",
            mode: "audio-isolation",
            artifacts,
            persistedArtifact: artifact,
            generatedBytes: isolated.audio.byteLength
          })
        ],
        transcript: isVoiceEnhance
          ? [
              `Enhanced isolated voice generated for ${job.fileName ?? job.sourceUrl ?? job.storageKey ?? job.id}.`,
              "Provider: ElevenLabs Audio Isolation.",
              "Output: isolated voice MP3 export with WAV conversion available from the result page."
            ].join("\n")
          : isVoiceChange
            ? [
                `Voice-changer source prepared for ${job.fileName ?? job.sourceUrl ?? job.storageKey ?? job.id}.`,
                "Provider: ElevenLabs Audio Isolation.",
                "Output: speech-isolated MP3 export with DeVoice voice-change preview rendering available from the result page."
              ].join("\n")
          : [
              `Clean audio generated for ${job.fileName ?? job.sourceUrl ?? job.storageKey ?? job.id}.`,
              "Provider: ElevenLabs Audio Isolation.",
              "Output: cleaned MP3 export with WAV conversion available from the result page."
            ].join("\n"),
        subtitles: "",
        summary: JSON.stringify({
          summary: isVoiceEnhance
            ? "The voice was isolated and enhanced with ElevenLabs Audio Isolation. The enhanced MP3 result is ready for playback/download, with WAV conversion available on export."
            : isVoiceChange
              ? "The speech source was isolated for the AI Voice Changer workflow. MP3 and WAV downloads are available from the result page."
            : "Background noise was removed with ElevenLabs Audio Isolation. The cleaned MP3 result is ready for playback/download, with WAV conversion available on export.",
          chapters: isVoiceEnhance
            ? [
                { title: "Source media received", startSec: 0 },
                { title: "Voice isolated", startSec: 8 },
                { title: "Enhanced voice export prepared", startSec: 18 }
              ]
            : isVoiceChange
              ? [
                  { title: "Source voice received", startSec: 0 },
                  { title: "Speech isolated", startSec: 8 },
                  { title: "Changed voice export prepared", startSec: 18 }
                ]
            : [
                { title: "Source media received", startSec: 0 },
                { title: "Background noise isolated", startSec: 8 },
                { title: "Clean export prepared", startSec: 18 }
              ],
          keywords: isVoiceEnhance
            ? ["audio isolation", "voice enhancer", "speech clarity", "DeVoice"]
            : isVoiceChange
              ? ["voice changer", "audio isolation", "AI voice", "DeVoice"]
              : ["audio isolation", "noise removal", "clean audio", "DeVoice"]
        }),
        translation: "",
        durationSec: 30
      }
    });
  } catch (error) {
    const fallback = buildDemoResult(job);
    const message = error instanceof Error ? error.message : "Unknown audio isolation error.";
    console.warn("ElevenLabs Audio Isolation failed; falling back to DeVoice demo result.", error);

    return prisma.mediaJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        provider: fallback.provider,
        fallbackTrail: [
          withoutUndefined({ provider: "ElevenLabs Audio Isolation", status: "failed", error: message }),
          withoutUndefined({ provider: fallback.provider, status: "success", mode: "inline-demo", artifacts: ["result-record", "wav-preview"] })
        ],
        transcript: fallback.transcript,
        subtitles: fallback.subtitles,
        summary: JSON.stringify(fallback.summary),
        translation: fallback.translation,
        durationSec: 30
      }
    });
  }
}
