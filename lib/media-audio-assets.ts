import { randomUUID } from "crypto";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { spawn } from "child_process";
import { getLocalMediaObject, isLocalMediaStorageKey } from "@/lib/local-media-store";
import { prisma } from "@/lib/prisma";
import { buildR2ObjectUrl, createDownloadUrl, getObjectBytes, hasR2Config, putObject } from "@/lib/r2";
import type { Prisma } from "@prisma/client";

type MediaJob = NonNullable<Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>>;

type AudioAssetRole = "source_audio" | "extracted_audio" | "linked_audio" | "voice_sample" | "generated_audio";

type CreateSourceAudioAssetInput = {
  job: MediaJob;
  contentType?: string | null;
};

type SegmentPlan = {
  index: number;
  startSec: number;
  endSec?: number;
  durationSec?: number;
};

type PreparedAudioAssetInput = {
  role: AudioAssetRole;
  storageKey: string | null;
  publicUrl?: string | null;
  contentType?: string | null;
  byteSize?: number;
  metadata: Prisma.InputJsonObject;
};

const audioExtensions = new Set([".mp3", ".wav", ".flac", ".aac", ".ogg", ".aiff", ".m4a", ".webm"]);
const videoExtensions = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm"]);

function cleanFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "audio.mp3";
}

function extensionFromFileName(fileName?: string | null) {
  return fileName ? path.extname(fileName).toLowerCase() : "";
}

export function isLikelyVideo(input: { sourceType?: string | null; fileName?: string | null; contentType?: string | null }) {
  if (input.sourceType === "video_to_text" || input.sourceType === "audio_extract") return true;
  if (input.contentType?.startsWith("video/")) return true;
  return videoExtensions.has(extensionFromFileName(input.fileName));
}

export function isLikelyAudio(input: { fileName?: string | null; contentType?: string | null }) {
  if (input.contentType?.startsWith("audio/")) return true;
  return audioExtensions.has(extensionFromFileName(input.fileName));
}

function audioContentType(fileName?: string | null) {
  const extension = extensionFromFileName(fileName);
  if (extension === ".wav") return "audio/wav";
  if (extension === ".flac") return "audio/flac";
  if (extension === ".ogg") return "audio/ogg";
  if (extension === ".m4a") return "audio/mp4";
  return "audio/mpeg";
}

function createSegmentPlan(durationSec?: number | null): SegmentPlan[] {
  const maxSegmentSec = Math.max(30, Number(process.env.DEVOICE_AUDIO_SEGMENT_SECONDS ?? 600));
  const overlapSec = Math.max(0, Number(process.env.DEVOICE_AUDIO_SEGMENT_OVERLAP_SECONDS ?? 5));

  if (!durationSec || durationSec <= maxSegmentSec) {
    return [{ index: 0, startSec: 0, endSec: durationSec ?? undefined, durationSec: durationSec ?? undefined }];
  }

  const segments: SegmentPlan[] = [];
  let startSec = 0;
  while (startSec < durationSec) {
    const endSec = Math.min(durationSec, startSec + maxSegmentSec);
    segments.push({
      index: segments.length,
      startSec,
      endSec,
      durationSec: Math.max(1, endSec - startSec)
    });
    if (endSec >= durationSec) break;
    startSec = Math.max(endSec - overlapSec, startSec + 1);
  }

  return segments;
}

function ffmpegPath() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

function runFfmpeg(args: string[], timeoutMs = Number(process.env.DEVOICE_FFMPEG_TIMEOUT_MS ?? 300000)) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath(), args, { stdio: ["ignore", "ignore", "pipe"] });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("ffmpeg processing timed out."));
    }, timeoutMs);
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk).slice(-4000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function withTempDir<T>(run: (dir: string) => Promise<T>) {
  const dir = await mkdtemp(path.join(tmpdir(), "devoice-media-"));
  try {
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function audioKey(job: MediaJob, fileName = "audio.mp3") {
  const workspace = job.workspaceId ?? job.userId ?? "personal";
  return `audio/${workspace}/${job.id}/${Date.now()}-${cleanFileName(fileName)}`;
}

function segmentKey(job: MediaJob, index: number) {
  const workspace = job.workspaceId ?? job.userId ?? "personal";
  return `segments/${workspace}/${job.id}/segment-${String(index + 1).padStart(4, "0")}.mp3`;
}

async function loadSourceBytes(job: MediaJob) {
  const storageKey = job.storageKey;
  const sourceUrl = job.sourceUrl;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    return (await getLocalMediaObject({ storageKey })).body;
  }

  if (sourceUrl && isLocalMediaStorageKey(sourceUrl)) {
    return (await getLocalMediaObject({ storageKey: sourceUrl })).body;
  }

  if (storageKey && !isLocalMediaStorageKey(storageKey)) {
    return getObjectBytes(storageKey);
  }

  const url = storageKey && !isLocalMediaStorageKey(storageKey) ? await createDownloadUrl(storageKey) : sourceUrl;
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("No downloadable media source is available.");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch linked media: HTTP ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function extractAudioWithFfmpeg(job: MediaJob, contentType?: string | null) {
  const sourceBytes = await loadSourceBytes(job);
  return withTempDir(async (dir) => {
    const inputPath = path.join(dir, cleanFileName(job.fileName ?? `source-${randomUUID()}`));
    const outputPath = path.join(dir, "audio.mp3");
    await writeFile(inputPath, sourceBytes);
    await runFfmpeg(["-y", "-i", inputPath, "-vn", "-acodec", "libmp3lame", "-b:a", "128k", outputPath]);
    const output = await readFile(outputPath);
    const uploaded = await putObject({
      storageKey: audioKey(job, `${path.parse(job.fileName ?? "video").name}.mp3`),
      contentType: "audio/mpeg",
      body: new Uint8Array(output)
    });

    return {
      role: "extracted_audio" as AudioAssetRole,
      storageKey: uploaded.storageKey,
      publicUrl: uploaded.publicUrl,
      contentType: "audio/mpeg",
      byteSize: output.byteLength,
      metadata: {
        extractor: "ffmpeg",
        inputContentType: contentType,
        inputStorageKey: job.storageKey
      }
    };
  });
}

async function copyUploadedAudioToAsset(job: MediaJob, contentType?: string | null) {
  const storageKey = job.storageKey;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    const localObject = await getLocalMediaObject({ storageKey });
    return {
      role: "source_audio" as AudioAssetRole,
      storageKey,
      publicUrl: job.sourceUrl,
      contentType: contentType ?? audioContentType(job.fileName),
      byteSize: localObject.byteSize,
      metadata: { source: "local-media" }
    };
  }

  if (!job.storageKey) {
    return {
      role: "linked_audio" as AudioAssetRole,
      storageKey: null,
      publicUrl: job.sourceUrl,
      contentType: contentType ?? audioContentType(job.fileName),
      byteSize: undefined,
      metadata: { source: "remote-url" }
    };
  }

  const bytes = hasR2Config() ? await getObjectBytes(job.storageKey) : null;
  const uploaded = bytes
    ? await putObject({
        storageKey: audioKey(job, job.fileName ?? "audio.mp3"),
        contentType: contentType ?? audioContentType(job.fileName),
        body: bytes
      })
    : { storageKey: job.storageKey, publicUrl: buildR2ObjectUrl(job.storageKey) };

  return {
    role: "source_audio" as AudioAssetRole,
    storageKey: uploaded.storageKey,
    publicUrl: uploaded.publicUrl,
    contentType: contentType ?? audioContentType(job.fileName),
    byteSize: bytes?.byteLength,
    metadata: {
      source: "uploaded-file",
      originalStorageKey: job.storageKey
    }
  };
}

async function uploadSegmentObjects(job: MediaJob, asset: { id: string; storageKey: string | null }, plan: SegmentPlan[]) {
  if (!hasR2Config() || !asset.storageKey || isLocalMediaStorageKey(asset.storageKey)) {
    return;
  }

  try {
    const sourceBytes = await getObjectBytes(asset.storageKey);
    await withTempDir(async (dir) => {
      const inputPath = path.join(dir, "source-audio");
      await writeFile(inputPath, sourceBytes);

      for (const segment of plan) {
        const outputPath = path.join(dir, `segment-${segment.index}.mp3`);
        const duration = segment.durationSec ?? (segment.endSec ? segment.endSec - segment.startSec : undefined);
        const args = ["-y", "-ss", String(segment.startSec), "-i", inputPath];
        if (duration && duration > 0) {
          args.push("-t", String(duration));
        }
        args.push("-acodec", "libmp3lame", "-b:a", "128k", outputPath);

        await runFfmpeg(args);
        const bytes = await readFile(outputPath);
        const uploaded = await putObject({
          storageKey: segmentKey(job, segment.index),
          contentType: "audio/mpeg",
          body: new Uint8Array(bytes)
        });

        await prisma.audioSegment.update({
          where: {
            audioAssetId_index: {
              audioAssetId: asset.id,
              index: segment.index
            }
          },
          data: {
            status: "ready",
            storageKey: uploaded.storageKey,
            publicUrl: uploaded.publicUrl,
            contentType: "audio/mpeg",
            byteSize: bytes.byteLength,
            metadata: {
              strategy: "ffmpeg-fixed-window-with-overlap",
              overlapSec: Number(process.env.DEVOICE_AUDIO_SEGMENT_OVERLAP_SECONDS ?? 5)
            }
          }
        });
      }
    });
  } catch (error) {
    await prisma.audioSegment.updateMany({
      where: { audioAssetId: asset.id, storageKey: null },
      data: {
        status: "planned",
        metadata: {
          strategy: "planned-after-segment-upload-failure",
          error: error instanceof Error ? error.message : "Segment upload failed."
        }
      }
    });
  }
}

async function persistSegmentRecords(job: MediaJob, audioAssetId: string, durationSec?: number | null) {
  const plan = createSegmentPlan(durationSec);
  const asset = await prisma.audioAsset.findUnique({ where: { id: audioAssetId } });
  if (!asset) return;

  await prisma.audioSegment.deleteMany({ where: { audioAssetId } });
  if (plan.length === 1 && !durationSec) {
    await prisma.audioSegment.create({
      data: {
        mediaJobId: job.id,
        audioAssetId,
        index: 0,
        startSec: 0,
        status: "planned",
        metadata: { strategy: "duration-pending", reason: "Provider has not returned duration yet." }
      }
    });
    return;
  }

  await prisma.audioSegment.createMany({
    data: plan.map((segment) => ({
      mediaJobId: job.id,
      audioAssetId,
      index: segment.index,
      startSec: segment.startSec,
      endSec: segment.endSec,
      durationSec: segment.durationSec,
      status: "planned",
      metadata: {
        strategy: "fixed-window-with-overlap",
        overlapSec: Number(process.env.DEVOICE_AUDIO_SEGMENT_OVERLAP_SECONDS ?? 5)
      } as Prisma.InputJsonObject
    }))
  });

  await uploadSegmentObjects(job, asset, plan);
}

export async function createSourceAudioAsset(input: CreateSourceAudioAssetInput) {
  const { job, contentType } = input;
  const existing = await prisma.audioAsset.findFirst({
    where: {
      mediaJobId: job.id,
      role: { in: ["source_audio", "extracted_audio", "linked_audio", "voice_sample"] }
    }
  });
  if (existing) return existing;

  const isVideo = isLikelyVideo({ sourceType: job.sourceType, fileName: job.fileName, contentType });
  let assetInput: PreparedAudioAssetInput;

  try {
    assetInput = isVideo ? await extractAudioWithFfmpeg(job, contentType) : await copyUploadedAudioToAsset(job, contentType);
  } catch (error) {
    assetInput = {
      role: isVideo ? "extracted_audio" : "linked_audio",
      storageKey: isVideo ? null : job.storageKey,
      publicUrl: job.sourceUrl,
      contentType: contentType ?? audioContentType(job.fileName),
      byteSize: undefined,
      metadata: {
        source: isVideo ? "video-extraction-pending" : "audio-link",
        error: error instanceof Error ? error.message : "Audio preparation failed.",
        requiresFfmpeg: isVideo
      }
    };
  }

  const asset = await prisma.audioAsset.create({
    data: {
      mediaJobId: job.id,
      userId: job.userId,
      workspaceId: job.workspaceId,
      role: assetInput.role,
      sourceKind: job.storageKey ? "upload" : "url",
      status: assetInput.storageKey || assetInput.publicUrl ? "ready" : "pending",
      provider: assetInput.role === "extracted_audio" ? "ffmpeg" : "DeVoice media pipeline",
      sourceUrl: job.sourceUrl,
      storageKey: assetInput.storageKey,
      publicUrl: assetInput.publicUrl,
      fileName: job.fileName,
      contentType: assetInput.contentType,
      byteSize: assetInput.byteSize,
      metadata: assetInput.metadata as Prisma.InputJsonObject
    }
  });

  await persistSegmentRecords(job, asset.id, job.durationSec);
  return asset;
}

export async function updateAudioSegmentPlanForJob(jobId: string, durationSec?: number | null) {
  const job = await prisma.mediaJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const asset = await prisma.audioAsset.findFirst({
    where: {
      mediaJobId: jobId,
      role: { in: ["source_audio", "extracted_audio", "linked_audio"] }
    },
    orderBy: { createdAt: "desc" }
  });
  if (!asset) return;

  await prisma.audioAsset.update({
    where: { id: asset.id },
    data: {
      durationSec: durationSec ?? undefined,
      status: asset.status === "pending" && (asset.storageKey || asset.publicUrl) ? "ready" : asset.status
    }
  });
  await persistSegmentRecords(job, asset.id, durationSec);
}

export async function registerGeneratedAudioAsset(input: {
  job: MediaJob;
  storageKey: string;
  publicUrl?: string;
  byteSize?: number;
  contentType?: string;
  provider?: string;
  role?: AudioAssetRole;
}) {
  return prisma.audioAsset.create({
    data: {
      mediaJobId: input.job.id,
      userId: input.job.userId,
      workspaceId: input.job.workspaceId,
      role: input.role ?? "generated_audio",
      sourceKind: "generated",
      status: "ready",
      provider: input.provider,
      sourceUrl: input.publicUrl,
      storageKey: input.storageKey,
      publicUrl: input.publicUrl,
      fileName: input.storageKey.split("/").pop(),
      contentType: input.contentType ?? "audio/mpeg",
      byteSize: input.byteSize
    }
  });
}
