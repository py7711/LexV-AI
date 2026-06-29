type ElevenLabsCloneInput = {
  text: string;
  sample: {
    bytes: Uint8Array;
    fileName?: string | null;
    contentType?: string | null;
  };
  name: string;
  description?: string;
};

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function normalizeText(value: string) {
  const maxChars = Number(process.env.ELEVENLABS_TTS_MAX_CHARS ?? 5000);
  return (value.replace(/\s+/g, " ").trim() || "DeVoice cloned voice audio is ready.").slice(0, Math.max(200, maxChars));
}

function elevenLabsApiKey() {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

function baseUrl() {
  return (process.env.ELEVENLABS_BASE_URL?.trim() || "https://api.elevenlabs.io").replace(/\/$/, "");
}

function arrayBufferCopy(bytes: Uint8Array) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function hasElevenLabsVoiceCloneProvider() {
  return Boolean(elevenLabsApiKey());
}

async function createInstantVoiceClone(input: ElevenLabsCloneInput) {
  const apiKey = elevenLabsApiKey();
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured.");

  const timeout = timeoutSignal(Number(process.env.ELEVENLABS_TIMEOUT_MS ?? 120000));
  const formData = new FormData();
  formData.set("name", input.name);
  if (input.description) {
    formData.set("description", input.description);
  }
  formData.append(
    "files",
    new Blob([arrayBufferCopy(input.sample.bytes)], {
      type: input.sample.contentType || "audio/mpeg"
    }),
    input.sample.fileName || "devoice-voice-sample.mp3"
  );

  try {
    const response = await fetch(`${baseUrl()}/v1/voices/add`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey
      },
      body: formData,
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs IVC HTTP ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { voice_id?: string; voiceId?: string };
    const voiceId = data.voice_id ?? data.voiceId;
    if (!voiceId) {
      throw new Error("ElevenLabs IVC did not return a voice_id.");
    }

    return voiceId;
  } finally {
    timeout.clear();
  }
}

async function generateSpeechWithClone(voiceId: string, text: string) {
  const apiKey = elevenLabsApiKey();
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured.");

  const timeout = timeoutSignal(Number(process.env.ELEVENLABS_TIMEOUT_MS ?? 120000));
  const modelId = process.env.ELEVENLABS_TTS_MODEL?.trim() || "eleven_multilingual_v2";

  try {
    const response = await fetch(`${baseUrl()}/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: normalizeText(text),
        model_id: modelId,
        output_format: process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || "mp3_44100_128"
      }),
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS HTTP ${response.status}: ${await response.text()}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  } finally {
    timeout.clear();
  }
}

export async function buildElevenLabsClonedSpeech(input: ElevenLabsCloneInput) {
  const voiceId = await createInstantVoiceClone(input);
  const audio = await generateSpeechWithClone(voiceId, input.text);

  return {
    provider: `ElevenLabs IVC (${process.env.ELEVENLABS_TTS_MODEL?.trim() || "eleven_multilingual_v2"})`,
    voiceId,
    audio
  };
}
