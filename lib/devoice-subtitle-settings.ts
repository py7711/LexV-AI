export const devoiceSubtitleFormats = [
  { value: "srt", label: "SRT" },
  { value: "vtt", label: "VTT" },
  { value: "txt", label: "TXT" }
] as const;

export function encodeSubtitleTarget(language: string, format: string) {
  return `${language}:${format}`;
}

export function parseSubtitleTarget(value?: string | null) {
  const [language = "EN", format = "srt"] = (value ?? "EN:srt").split(":");
  const knownFormat = devoiceSubtitleFormats.some((item) => item.value === format) ? format : "srt";
  return {
    language,
    format: knownFormat.toUpperCase()
  };
}
