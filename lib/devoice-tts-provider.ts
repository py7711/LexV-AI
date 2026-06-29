import { devoiceVoices } from "@/lib/devoice-voice-settings";

type SpeechFormat = "mp3" | "wav";

type OpenAiSpeechVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";

const OPENAI_SPEECH_VOICES = new Set<OpenAiSpeechVoice>([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer"
]);

const LOCAL_TO_OPENAI_VOICE: Record<string, OpenAiSpeechVoice> = {
  sonia: "nova",
  ryan: "onyx",
  libby: "shimmer",
  abbi: "coral",
  ada: "sage",
  alfie: "echo",
  bella: "alloy",
  elliot: "ash",
  ethan: "echo",
  hollie: "shimmer",
  maisie: "nova",
  noah: "onyx",
  oliver: "echo",
  olivia: "coral",
  thomas: "fable",
  ollie: "ash"
};

function configuredVoice(value?: string | null): OpenAiSpeechVoice | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return OPENAI_SPEECH_VOICES.has(normalized as OpenAiSpeechVoice) ? (normalized as OpenAiSpeechVoice) : null;
}

function normalizeSpeechInput(text: string) {
  const stripped = text.replace(/^data:text\/plain,?/i, "");
  let decoded = stripped;

  try {
    decoded = decodeURIComponent(stripped);
  } catch {
    decoded = stripped;
  }

  const maxChars = Number(process.env.OPENAI_TTS_MAX_CHARS ?? 4096);
  return (decoded.replace(/\s+/g, " ").trim() || "DeVoice audio is ready.").slice(0, Math.max(200, maxChars));
}

function voiceInstructions(voiceId?: string | null) {
  const localVoice = devoiceVoices.find((voice) => voice.id === voiceId);
  if (!localVoice) {
    return "Speak in a clear, natural studio voice suitable for a DeVoice generated audio export.";
  }

  return `Speak in a natural ${localVoice.gender.toLowerCase()} studio voice similar in tone to ${localVoice.name}. Keep pacing clear and expressive.`;
}

export function hasOpenAiSpeechProvider() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function buildOpenAiSpeechAudio(input: {
  text: string;
  voiceId?: string | null;
  format: SpeechFormat;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const voice =
    configuredVoice(process.env.OPENAI_TTS_VOICE) ??
    LOCAL_TO_OPENAI_VOICE[input.voiceId ?? ""] ??
    configuredVoice(process.env.OPENAI_TTS_FALLBACK_VOICE) ??
    "alloy";
  const model = process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
  const timeoutMs = Number(process.env.OPENAI_TTS_TIMEOUT_MS ?? 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        voice,
        input: normalizeSpeechInput(input.text),
        instructions: voiceInstructions(input.voiceId),
        response_format: input.format
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`OpenAI speech HTTP ${response.status}: ${await response.text()}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}
