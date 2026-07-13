import { completeJobWithDemoResult, buildDemoResult, type DemoMediaJob } from "@/lib/devoice-demo-processing";
import { buildAssemblyAiClonedSpeech, hasAssemblyAiVoiceCloneProvider } from "@/lib/assemblyai-voice-clone";
import { buildOpenAiSpeechAudio, hasOpenAiSpeechProvider } from "@/lib/devoice-tts-provider";
import { getVoiceLabel, getVoiceLanguageLabel } from "@/lib/devoice-voice-settings";
import { registerGeneratedAudioAsset } from "@/lib/media-audio-assets";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl, getObjectBytes, hasR2Config, putObject } from "@/lib/r2";
import { getLocalMediaObject, isLocalMediaStorageKey } from "@/lib/local-media-store";
import type { Prisma } from "@prisma/client";
import { isDeVoiceJobType, type DeVoiceJobType } from "@/types/devoice-job";

type MediaJob = NonNullable<Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>>;

export function isVoiceGenerationJob(sourceType: string) {
  return sourceType === "text_to_speech" || sourceType === "voice_clone" || sourceType === "ai_dubbing";
}

export function shouldUseSpeechProviderForJob(sourceType: string) {
  return sourceType === "voice_clone"
    ? hasAssemblyAiVoiceCloneProvider() || hasOpenAiSpeechProvider()
    : (sourceType === "text_to_speech" || sourceType === "ai_dubbing") && hasOpenAiSpeechProvider();
}

function jobTypeOf(sourceType: string): DeVoiceJobType {
  return isDeVoiceJobType(sourceType) ? sourceType : "speech_to_text";
}

function sourceText(job: Pick<MediaJob, "sourceUrl" | "transcript" | "fileName" | "id">) {
  if (job.sourceUrl?.startsWith("data:text/plain,")) {
    const raw = job.sourceUrl.replace(/^data:text\/plain,?/i, "");
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw.trim();
    }
  }

  return job.transcript?.trim() || job.fileName || job.id;
}

function openAiProviderLabel() {
  return `OpenAI Speech (${process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts"})`;
}

type PersistedVoiceArtifact = {
  format: "mp3";
  contentType: "audio/mpeg";
  storageKey: string;
  publicUrl?: string;
  bytes: number;
};

type TrailItem = Prisma.JsonObject;

function generatedArtifactKey(job: MediaJob, format: "mp3") {
  const workspace = job.workspaceId ?? job.userId ?? "personal";
  const safeId = job.id.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `generated/${workspace}/${safeId}/speech.${format}`;
}

async function persistGeneratedVoiceArtifact(job: MediaJob, audio: Uint8Array): Promise<PersistedVoiceArtifact | null> {
  if (!hasR2Config()) {
    return null;
  }

  let uploaded;
  try {
    uploaded = await putObject({
      storageKey: generatedArtifactKey(job, "mp3"),
      contentType: "audio/mpeg",
      body: audio
    });
  } catch (error) {
    console.warn("OpenAI speech audio was generated, but DeVoice could not persist the MP3 artifact.", error);
    return null;
  }

  return {
    format: "mp3",
    contentType: "audio/mpeg",
    storageKey: uploaded.storageKey,
    publicUrl: uploaded.publicUrl,
    bytes: audio.byteLength
  };
}

async function persistAndRegisterGeneratedVoiceArtifact(job: MediaJob, audio: Uint8Array, provider: string) {
  const artifact = await persistGeneratedVoiceArtifact(job, audio);
  if (artifact) {
    await registerGeneratedAudioAsset({
      job,
      storageKey: artifact.storageKey,
      publicUrl: artifact.publicUrl,
      byteSize: artifact.bytes,
      contentType: artifact.contentType,
      provider
    });
  }
  return artifact;
}

type VoiceCloneSample = {
  bytes: Uint8Array;
  fileName?: string | null;
  contentType?: string | null;
  source: "r2" | "url";
};

async function resolveVoiceCloneSample(job: MediaJob): Promise<VoiceCloneSample> {
  const storageKey = job.storageKey;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    return {
      bytes: (await getLocalMediaObject({ storageKey })).body,
      fileName: job.fileName,
      contentType: job.fileName?.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg",
      source: "url"
    };
  }

  if (storageKey && !isLocalMediaStorageKey(storageKey)) {
    return {
      bytes: await getObjectBytes(storageKey),
      fileName: job.fileName,
      contentType: job.fileName?.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg",
      source: "r2"
    };
  }

  if (job.sourceUrl?.startsWith("http://") || job.sourceUrl?.startsWith("https://")) {
    const url = job.sourceUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to fetch voice clone sample: HTTP ${response.status}`);
    }
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      fileName: job.fileName ?? url.split("/").pop() ?? "voice-sample.mp3",
      contentType: response.headers.get("content-type"),
      source: "url"
    };
  }

  if (storageKey) {
    try {
      const url = await createDownloadUrl(storageKey);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        fileName: job.fileName,
        contentType: response.headers.get("content-type"),
        source: "r2"
      };
    } catch (error) {
      throw new Error(`Unable to read voice clone sample: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error("Voice cloning requires a downloadable uploaded voice sample.");
}

function buildProviderResult(
  job: DemoMediaJob,
  generatedBytes: number,
  artifact: PersistedVoiceArtifact | null,
  provider: string,
  options?: { clonedVoiceId?: string; sampleSource?: string }
) {
  const jobType = jobTypeOf(job.sourceType);
  const language = getVoiceLanguageLabel(job.language);
  const voice = getVoiceLabel(job.targetLanguage);
  const text = sourceText({ ...job, transcript: null });
  const artifacts = artifact ? ["provider-audio-check", "persisted-mp3", "export-time-wav"] : ["provider-audio-check", "export-time-mp3", "export-time-wav"];

  if (jobType === "voice_clone") {
    return {
      transcript: [
        "Voice generation completed with a production speech provider.",
        `Language: ${language}.`,
        `Voice / target style: ${voice}.`,
        `Sample: ${job.fileName ?? job.storageKey ?? "uploaded voice sample"}.`,
        "",
        "Input text:",
        text
      ].join("\n"),
      summary: {
        summary:
          options?.clonedVoiceId
            ? "A sample-based voice clone generated a downloadable voice audio export from the uploaded reference sample."
            : "OpenAI Speech generated a downloadable voice audio export. The uploaded sample is retained as the requested voice reference, but true sample-based cloning still requires a dedicated cloning provider.",
        chapters: [
          { title: "Voice request received", startSec: 0 },
          { title: options?.clonedVoiceId ? "Voice sample cloned" : "Speech provider generated audio", startSec: 5 },
          { title: "MP3/WAV exports ready", startSec: 12 }
        ],
        keywords: [options?.clonedVoiceId ? "voice cloning" : "voice generation", provider, language, voice]
      },
      provider,
      artifacts,
      persistedArtifact: artifact,
      clonedVoiceId: options?.clonedVoiceId,
      sampleSource: options?.sampleSource,
      generatedBytes
    };
  }

  return {
    transcript: [
      jobType === "ai_dubbing" ? "AI dubbing completed with a production speech provider." : "AI voice generation completed with a production speech provider.",
      `Language: ${language}.`,
      `Voice: ${voice}.`,
      "",
      jobType === "ai_dubbing" ? "Dubbing script:" : "Input text:",
      text
    ].join("\n"),
    summary: {
      summary: jobType === "ai_dubbing"
        ? `OpenAI Speech generated AI dubbing audio with ${voice} in ${language}. MP3 and WAV exports are available from the result page.`
        : `OpenAI Speech generated voice audio with ${voice} in ${language}. MP3 and WAV exports are available from the result page.`,
      chapters: [
        { title: jobType === "ai_dubbing" ? "Dubbing settings prepared" : "Voice settings prepared", startSec: 0 },
        { title: jobType === "ai_dubbing" ? "Speech provider generated dubbing" : "Speech provider generated audio", startSec: 5 },
        { title: "MP3/WAV exports ready", startSec: 12 }
      ],
      keywords: [jobType === "ai_dubbing" ? "AI dubbing" : "text to speech", "OpenAI Speech", language, voice]
    },
    provider,
    artifacts,
    persistedArtifact: artifact,
    generatedBytes
  };
}

async function completeVoiceCloneWithAssemblyAi(job: MediaJob) {
  const sample = await resolveVoiceCloneSample(job);
  const result = await buildAssemblyAiClonedSpeech({
    text: sourceText(job),
    name: `DeVoice ${job.id}`.slice(0, 80),
    description: "Generated by DeVoice AI Voice Cloning with AssemblyAI.",
    sample: {
      bytes: sample.bytes,
      fileName: sample.fileName,
      contentType: sample.contentType
    }
  });
  const artifact = await persistAndRegisterGeneratedVoiceArtifact(job, result.audio, result.provider);
  const providerResult = buildProviderResult(job, result.audio.byteLength, artifact, result.provider, {
    clonedVoiceId: result.voiceId,
    sampleSource: sample.source
  });

  return prisma.mediaJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      provider: providerResult.provider,
      fallbackTrail: [
        withoutUndefined({
          provider: providerResult.provider,
          status: "success",
          mode: "assemblyai-sample-voice-clone",
          artifacts: providerResult.artifacts,
          persistedArtifact: providerResult.persistedArtifact,
          clonedVoiceId: providerResult.clonedVoiceId,
          sampleSource: providerResult.sampleSource,
          generatedBytes: providerResult.generatedBytes
        })
      ],
      transcript: providerResult.transcript,
      subtitles: "",
      summary: JSON.stringify(providerResult.summary),
      translation: "",
      durationSec: 30
    }
  });
}

function withoutUndefined(value: Record<string, unknown>): TrailItem {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as TrailItem;
}

async function completeWithOpenAiSpeech(job: MediaJob, priorTrail: TrailItem[] = []) {
  const audio = await buildOpenAiSpeechAudio({
    text: sourceText(job),
    voiceId: job.targetLanguage,
    format: "mp3"
  });
  const artifact = await persistAndRegisterGeneratedVoiceArtifact(job, audio, openAiProviderLabel());
  const result = buildProviderResult(job, audio.byteLength, artifact, openAiProviderLabel());

  return prisma.mediaJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      provider: result.provider,
      fallbackTrail: [
        ...priorTrail,
        withoutUndefined({
          provider: result.provider,
          status: "success",
          mode: "speech-provider",
          artifacts: result.artifacts,
          persistedArtifact: result.persistedArtifact,
          generatedBytes: result.generatedBytes
        })
      ],
      transcript: result.transcript,
      subtitles: "",
      summary: JSON.stringify(result.summary),
      translation: "",
      durationSec: 30
    }
  });
}

async function completeWithDemoFallback(job: MediaJob, priorTrail: TrailItem[]) {
  const fallback = buildDemoResult(job);

  return prisma.mediaJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      provider: fallback.provider,
      fallbackTrail: [
        ...priorTrail,
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

export async function completeVoiceJobWithProviderResult(jobId: string) {
  const job = await prisma.mediaJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("Media job does not exist.");
  }

  if (!isVoiceGenerationJob(job.sourceType)) {
    return completeJobWithDemoResult(jobId);
  }

  if (!hasOpenAiSpeechProvider()) {
    if (job.sourceType === "voice_clone" && hasAssemblyAiVoiceCloneProvider()) {
      try {
        return await completeVoiceCloneWithAssemblyAi(job);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown AssemblyAI voice clone error.";
        console.warn("AssemblyAI voice cloning failed; falling back to DeVoice demo result.", error);
        return completeWithDemoFallback(job, [withoutUndefined({ provider: "AssemblyAI Voice Clone", status: "failed", error: message })]);
      }
    }

    return completeJobWithDemoResult(jobId);
  }

  try {
    if (job.sourceType === "voice_clone" && hasAssemblyAiVoiceCloneProvider()) {
      try {
        return await completeVoiceCloneWithAssemblyAi(job);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown AssemblyAI voice clone error.";
        console.warn("AssemblyAI voice cloning failed; falling back to OpenAI Speech.", error);
        return completeWithOpenAiSpeech(job, [withoutUndefined({ provider: "AssemblyAI Voice Clone", status: "failed", error: message })]);
      }
    }

    return completeWithOpenAiSpeech(job);
  } catch (error) {
    const failedProvider = job.sourceType === "voice_clone" && hasAssemblyAiVoiceCloneProvider() ? "AssemblyAI Voice Clone" : openAiProviderLabel();
    const message = error instanceof Error ? error.message : "Unknown voice provider error.";
    console.warn("Voice provider job completion failed; falling back to DeVoice demo result.", error);
    return completeWithDemoFallback(job, [withoutUndefined({ provider: failedProvider, status: "failed", error: message })]);
  }
}
