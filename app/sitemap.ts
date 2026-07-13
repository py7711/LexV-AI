import type { MetadataRoute } from "next";
import { localizedPath, locales, siteUrl } from "@/lib/i18n";

const sitemapPaths = [
  "",
  "audio-to-text",
  "video-to-text",
  "ai-speech-to-text",
  "remove-background-noise",
  "ai-noise-filter",
  "text-to-speech",
  "ai-voice-generator",
  "ai-dubbing",
  "ai-voice-actors",
  "ai-voice-cloning",
  "ai-voice-enhancer-isolate",
  "ai-voice-changer",
  "ai-music-generator",
  "ai-rap-generator",
  "ai-rap-lyrics-generator",
  "audio-extract-from-video",
  "transcribe-youtube-videos",
  "youtube-transcript-generator",
  "youtube-subtitle-downloader",
  "youtube-video-summarizer",
  "pricing",
  "demo/text-to-speech",
  "blog",
  "blog/how-to-download-youtube-videos",
  "blog/exploring-ai-vocal-cleaner-clean-up-audios",
  "blog/how-to-extract-audio-from-video",
  "blog/ai-noise-remover-tools-for-dynamic-noise-reduction-online",
  "blog/how-to-get-the-audio-from-a-video",
  "blog/remove-lead-vocals-from-songs",
  "blog/how-to-remove-music-from-video",
  "blog/remove-background-noise-and-background-conversation",
  "blog/remove-background-music-from-audio",
  "my-resources",
  "payment/loading",
  "payment/result",
  "privacy-policy",
  "refund-policy",
  "terms-of-use"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return sitemapPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localizedPath(locale, path)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path ? 0.8 : locale === "en" ? 1 : 0.9,
      alternates: {
        languages: Object.fromEntries(locales.map((item) => [item, `${siteUrl}${localizedPath(item, path)}`]))
      }
    }))
  );
}
