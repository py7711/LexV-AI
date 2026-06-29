type AssemblyAiCloneInput = {
  text: string;
  sample: {
    bytes: Uint8Array;
    fileName?: string | null;
    contentType?: string | null;
  };
  name: string;
  description?: string;
};

function apiKey() {
  return process.env.ASSEMBLYAI_API_KEY?.trim() || null;
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function normalizeText(value: string) {
  const maxChars = Number(process.env.ASSEMBLYAI_VOICE_CLONE_MAX_CHARS ?? 5000);
  return (value.replace(/\s+/g, " ").trim() || "DeVoice cloned voice audio is ready.").slice(0, Math.max(200, maxChars));
}

function arrayBufferCopy(bytes: Uint8Array) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function hasAssemblyAiVoiceCloneProvider() {
  return Boolean(apiKey() && process.env.ASSEMBLYAI_VOICE_CLONE_ENDPOINT?.trim());
}

export async function buildAssemblyAiClonedSpeech(input: AssemblyAiCloneInput) {
  const token = apiKey();
  const endpoint = process.env.ASSEMBLYAI_VOICE_CLONE_ENDPOINT?.trim();
  if (!token) throw new Error("ASSEMBLYAI_API_KEY is not configured.");
  if (!endpoint) throw new Error("ASSEMBLYAI_VOICE_CLONE_ENDPOINT is not configured.");

  const timeout = timeoutSignal(Number(process.env.ASSEMBLYAI_VOICE_CLONE_TIMEOUT_MS ?? 180000));
  const formData = new FormData();
  formData.set("text", normalizeText(input.text));
  formData.set("name", input.name);
  if (input.description) {
    formData.set("description", input.description);
  }
  formData.append(
    "file",
    new Blob([arrayBufferCopy(input.sample.bytes)], {
      type: input.sample.contentType || "audio/mpeg"
    }),
    input.sample.fileName || "devoice-voice-sample.mp3"
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: token,
        Accept: "audio/mpeg"
      },
      body: formData,
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI voice clone HTTP ${response.status}: ${await response.text()}`);
    }

    return {
      provider: "AssemblyAI Voice Clone",
      voiceId: response.headers.get("x-assemblyai-voice-id") ?? undefined,
      audio: new Uint8Array(await response.arrayBuffer())
    };
  } finally {
    timeout.clear();
  }
}
