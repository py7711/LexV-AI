import { devoiceVoices } from "@/lib/devoice-voice-settings";
import { createLocalMediaDownloadUrl, isLocalMediaStorageKey } from "@/lib/local-media-store";
import { createDownloadUrl } from "@/lib/r2";
import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

type PreviewKind = "remove_noise" | "voice_enhance" | "voice_change" | "audio_extract" | "ai_dubbing" | "ai_music" | "ai_rap" | "text_to_speech" | "voice_clone";

type PreviewOptions = {
  kind: PreviewKind;
  text: string;
  voiceId?: string | null;
  seed?: string | null;
};

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise(seed: number, index: number) {
  const value = Math.sin((seed + index * 17.17) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function clampSample(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function wavFromSamples(samples: Float32Array, sampleRate: number) {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(44 + index * 2, Math.round(clampSample(samples[index]) * 32767), true);
  }

  return new Uint8Array(buffer);
}

function voiceBaseFrequency(voiceId?: string | null) {
  return devoiceVoices.find((voice) => voice.id === voiceId)?.frequency ?? 360;
}

function normalizePreviewText(text: string) {
  return text
    .replace(/^data:text\/plain,?/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

function buildSpeechLikeSamples(options: PreviewOptions) {
  const sampleRate = 16000;
  const normalizedText = normalizePreviewText(options.text) || "DeVoice preview audio is ready.";
  const seed = hashText(`${options.kind}:${options.voiceId ?? ""}:${options.seed ?? ""}:${normalizedText}`);
  const base = voiceBaseFrequency(options.voiceId);
  const chars = [...normalizedText].filter((char) => char.trim());
  const units = chars.length ? chars : [..."DeVoice"];
  const samplesPerUnit = options.kind === "remove_noise" || options.kind === "voice_enhance" || options.kind === "voice_change" || options.kind === "audio_extract" ? 760 : options.kind === "ai_music" || options.kind === "ai_rap" ? 680 : 920;
  const pauseSamples = options.kind === "voice_clone" ? 90 : 130;
  const maxUnits = Math.min(units.length, 150);
  const leadIn = Math.round(sampleRate * 0.18);
  const tail = Math.round(sampleRate * 0.38);
  const totalSamples = leadIn + maxUnits * (samplesPerUnit + pauseSamples) + tail;
  const samples = new Float32Array(totalSamples);
  let cursor = leadIn;

  for (let unitIndex = 0; unitIndex < maxUnits; unitIndex += 1) {
    const charCode = units[unitIndex].codePointAt(0) ?? 64;
    const pitchStep = ((charCode + unitIndex * 7) % 11) - 5;
    const baseFrequency = base * Math.pow(2, pitchStep / 24);
    const formantOne = baseFrequency * (1.85 + ((charCode % 5) * 0.08));
    const formantTwo = baseFrequency * (2.8 + ((charCode % 7) * 0.06));
    const amplitude =
      options.kind === "remove_noise" ? 0.2 :
      options.kind === "voice_enhance" ? 0.24 :
      options.kind === "voice_change" ? 0.27 :
      options.kind === "audio_extract" ? 0.22 :
      options.kind === "ai_music" ? 0.28 :
      options.kind === "ai_rap" ? 0.3 :
      options.kind === "voice_clone" ? 0.26 :
      0.24;

    for (let offset = 0; offset < samplesPerUnit && cursor + offset < samples.length; offset += 1) {
      const t = offset / sampleRate;
      const progress = offset / samplesPerUnit;
      const attack = Math.min(1, progress / 0.12);
      const release = Math.min(1, (1 - progress) / 0.18);
      const envelope = Math.sin(Math.PI * progress) * Math.min(attack, release);
      const vibrato = Math.sin(2 * Math.PI * 5.2 * t + unitIndex) * 3.5;
      const voiced =
        Math.sin((2 * Math.PI * (baseFrequency + vibrato) * (cursor + offset)) / sampleRate) * 0.52 +
        Math.sin((2 * Math.PI * formantOne * (cursor + offset)) / sampleRate) * 0.28 +
        Math.sin((2 * Math.PI * formantTwo * (cursor + offset)) / sampleRate) * 0.13;
      const breath = (seededNoise(seed, cursor + offset) - 0.5) * (options.kind === "remove_noise" || options.kind === "voice_enhance" || options.kind === "voice_change" || options.kind === "audio_extract" ? 0.012 : 0.028);
      const cleanupGate = options.kind === "remove_noise" || options.kind === "voice_enhance" || options.kind === "voice_change" ? 0.78 + 0.22 * Math.sin(Math.PI * progress) : 1;
      samples[cursor + offset] += (voiced * amplitude * envelope + breath * envelope) * cleanupGate;
    }

    cursor += samplesPerUnit + pauseSamples + (/[,.!?;:]/.test(units[unitIndex]) ? 520 : 0);
  }

  for (let index = 0; index < samples.length; index += 1) {
    const fadeIn = Math.min(1, index / Math.max(1, leadIn));
    const fadeOut = Math.min(1, (samples.length - index) / Math.max(1, tail));
    samples[index] *= Math.min(fadeIn, fadeOut);
  }

  return { samples, sampleRate };
}

export function buildDeVoicePreviewWav(options: PreviewOptions) {
  const { samples, sampleRate } = buildSpeechLikeSamples(options);
  return wavFromSamples(samples, sampleRate);
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const binary = process.env.FFMPEG_PATH ?? "ffmpeg";
    const child = spawn(binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    const stderr: Buffer[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
    });
    child.on("error", (error) => {
      reject(new Error(`MP3 export requires ffmpeg. ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const message = Buffer.concat(stderr).toString("utf8").trim();
      reject(new Error(message || `ffmpeg exited with code ${code ?? "unknown"}.`));
    });
  });
}

export async function convertAudioBytes(input: {
  bytes: Uint8Array;
  inputFileName: string;
  outputFileName: string;
  args: string[];
}) {
  const tempDir = await mkdtemp(join(tmpdir(), "devoice-audio-convert-"));
  const inputPath = join(tempDir, input.inputFileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "input-media");
  const outputPath = join(tempDir, input.outputFileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "output-media");

  try {
    await writeFile(inputPath, input.bytes);
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      ...input.args,
      outputPath
    ]);

    return new Uint8Array(await readFile(outputPath));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function resolveMediaUrl(input: { sourceUrl?: string | null; storageKey?: string | null }) {
  const storageKey = input.storageKey;
  const sourceUrl = input.sourceUrl;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    return createLocalMediaDownloadUrl(storageKey);
  }

  if (sourceUrl && isLocalMediaStorageKey(sourceUrl)) {
    return createLocalMediaDownloadUrl(sourceUrl);
  }

  if (sourceUrl?.startsWith("http://") || sourceUrl?.startsWith("https://")) {
    return sourceUrl;
  }

  if (storageKey) {
    return createDownloadUrl(storageKey);
  }

  return null;
}

async function fetchMediaBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch source media: HTTP ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function buildCleanedNoiseReductionWav(input: {
  sourceUrl?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
}) {
  const mediaUrl = await resolveMediaUrl(input);
  if (!mediaUrl) {
    throw new Error("No downloadable source media is available for noise reduction.");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "devoice-clean-audio-"));
  const inputPath = join(tempDir, input.fileName?.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "source-media");
  const outputPath = join(tempDir, "cleaned.wav");

  try {
    await writeFile(inputPath, await fetchMediaBytes(mediaUrl));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "44100",
      "-af",
      "highpass=f=90,lowpass=f=12000,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11",
      "-t",
      "300",
      outputPath
    ]);

    return new Uint8Array(await readFile(outputPath));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function extractAudioFromMedia(input: {
  sourceUrl?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
  format: "mp3" | "wav";
}) {
  const mediaUrl = await resolveMediaUrl(input);
  if (!mediaUrl) {
    throw new Error("No downloadable source media is available for audio extraction.");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "devoice-audio-extract-"));
  const inputPath = join(tempDir, input.fileName?.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "source-video");
  const outputPath = join(tempDir, input.format === "mp3" ? "extracted.mp3" : "extracted.wav");

  try {
    await writeFile(inputPath, await fetchMediaBytes(mediaUrl));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "2",
      "-ar",
      "44100",
      "-t",
      "300",
      ...(input.format === "mp3" ? ["-codec:a", "libmp3lame", "-b:a", "160k"] : []),
      outputPath
    ]);

    return new Uint8Array(await readFile(outputPath));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function buildDeVoicePreviewMp3(options: PreviewOptions) {
  const tempDir = await mkdtemp(join(tmpdir(), "devoice-mp3-"));
  const wavPath = join(tempDir, "preview.wav");
  const mp3Path = join(tempDir, "preview.mp3");

  try {
    await writeFile(wavPath, buildDeVoicePreviewWav(options));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      wavPath,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "96k",
      mp3Path
    ]);
    return new Uint8Array(await readFile(mp3Path));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
