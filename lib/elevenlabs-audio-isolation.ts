import { createDownloadUrl, getObjectBytes } from "@/lib/r2";
import { getLocalMediaObject, isLocalMediaStorageKey } from "@/lib/local-media-store";

type AudioIsolationInput = {
  sourceUrl?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
};

function elevenLabsApiKey() {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

function baseUrl() {
  return (process.env.ELEVENLABS_BASE_URL?.trim() || "https://api.elevenlabs.io").replace(/\/$/, "");
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function arrayBufferCopy(bytes: Uint8Array) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function contentTypeForFile(fileName?: string | null) {
  const lower = fileName?.toLowerCase() ?? "";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return "audio/mpeg";
}

async function resolveMediaBytes(input: AudioIsolationInput) {
  const storageKey = input.storageKey;
  const sourceUrl = input.sourceUrl;

  if (storageKey && isLocalMediaStorageKey(storageKey)) {
    return {
      bytes: (await getLocalMediaObject({ storageKey })).body,
      fileName: input.fileName ?? storageKey.split("/").pop() ?? "devoice-source-media",
      contentType: contentTypeForFile(input.fileName ?? storageKey)
    };
  }

  if (storageKey && !isLocalMediaStorageKey(storageKey)) {
    return {
      bytes: await getObjectBytes(storageKey),
      fileName: input.fileName ?? storageKey.split("/").pop() ?? "devoice-source-media",
      contentType: contentTypeForFile(input.fileName ?? storageKey)
    };
  }

  if (sourceUrl?.startsWith("http://") || sourceUrl?.startsWith("https://")) {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Unable to fetch source media: HTTP ${response.status}`);
    }
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      fileName: input.fileName ?? sourceUrl.split("/").pop() ?? "devoice-source-media",
      contentType: response.headers.get("content-type") ?? contentTypeForFile(input.fileName)
    };
  }

  if (storageKey) {
    const url = await createDownloadUrl(storageKey);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to fetch source media: HTTP ${response.status}`);
    }
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      fileName: input.fileName ?? storageKey.split("/").pop() ?? "devoice-source-media",
      contentType: response.headers.get("content-type") ?? contentTypeForFile(input.fileName ?? storageKey)
    };
  }

  throw new Error("No downloadable source media is available for audio isolation.");
}

export function hasElevenLabsAudioIsolationProvider() {
  return Boolean(elevenLabsApiKey());
}

export async function buildElevenLabsIsolatedAudio(input: AudioIsolationInput) {
  const apiKey = elevenLabsApiKey();
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured.");

  const media = await resolveMediaBytes(input);
  const timeout = timeoutSignal(Number(process.env.ELEVENLABS_AUDIO_ISOLATION_TIMEOUT_MS ?? process.env.ELEVENLABS_TIMEOUT_MS ?? 180000));
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([arrayBufferCopy(media.bytes)], { type: media.contentType }),
    media.fileName
  );

  try {
    const response = await fetch(`${baseUrl()}/v1/audio-isolation`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        Accept: "audio/mpeg"
      },
      body: formData,
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs Audio Isolation HTTP ${response.status}: ${await response.text()}`);
    }

    return {
      provider: "ElevenLabs Audio Isolation",
      audio: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "audio/mpeg"
    };
  } finally {
    timeout.clear();
  }
}
