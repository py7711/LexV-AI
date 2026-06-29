import type { MetadataRoute } from "next";
import { localizedPath, locales, siteUrl } from "@/lib/i18n";

const sitemapPaths = [
  "",
  "audio-to-text",
  "video-to-text",
  "ai-speech-to-text",
  "remove-background-noise",
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
  "youtube-transcript-generator",
  "youtube-subtitle-downloader",
  "youtube-video-summarizer",
  "pricing",
  "demo/text-to-speech",
  "blog",
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
