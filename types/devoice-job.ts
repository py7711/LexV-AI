export const devoiceJobTypes = [
  "speech_to_text",
  "audio_to_text",
  "video_to_text",
  "youtube_transcript",
  "youtube_subtitle",
  "youtube_summary",
  "remove_noise",
  "voice_enhance",
  "voice_change",
  "audio_extract",
  "ai_dubbing",
  "ai_music",
  "ai_rap",
  "rap_lyrics",
  "text_to_speech",
  "voice_clone"
] as const;

export type DeVoiceJobType = (typeof devoiceJobTypes)[number];

export function isDeVoiceJobType(value: string): value is DeVoiceJobType {
  return devoiceJobTypes.includes(value as DeVoiceJobType);
}
