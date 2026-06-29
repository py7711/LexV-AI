import { Youtube } from "lucide-react";
import Image from "next/image";
import { localizedPath, type Locale } from "@/lib/i18n";

export function DeVoiceFooter({ locale }: { locale: Locale }) {
  const footerGroups: Array<[string, string[]]> = [
    ["AI Transcriber", ["Audio To Text", "Video To Text", "AI Speech to Text"]],
    ["AI Voices", ["AI Noise Remover", "Text to Speech", "AI Voice Generator", "AI Voice Cloning"]],
    ["AI YouTube", ["YouTube Transcript Generator", "YouTube Subtitle Downloader", "YouTube Video Summarizer"]],
    ["Resource", ["Blog", "Privacy Policy", "Refund Policy", "Terms of Use"]]
  ];
  const hrefs: Record<string, string> = {
    "Audio To Text": localizedPath(locale, "audio-to-text"),
    "Video To Text": localizedPath(locale, "video-to-text"),
    "AI Speech to Text": localizedPath(locale, "ai-speech-to-text"),
    "AI Noise Remover": localizedPath(locale, "remove-background-noise"),
    "Text to Speech": localizedPath(locale, "text-to-speech"),
    "AI Voice Generator": localizedPath(locale, "ai-voice-generator"),
    "AI Voice Cloning": localizedPath(locale, "ai-voice-cloning"),
    "YouTube Transcript Generator": localizedPath(locale, "youtube-transcript-generator"),
    "YouTube Subtitle Downloader": localizedPath(locale, "youtube-subtitle-downloader"),
    "YouTube Video Summarizer": localizedPath(locale, "youtube-video-summarizer"),
    Blog: localizedPath(locale, "blog"),
    "Privacy Policy": localizedPath(locale, "privacy-policy"),
    "Refund Policy": localizedPath(locale, "refund-policy"),
    "Terms of Use": localizedPath(locale, "terms-of-use")
  };

  return (
    <footer className="devoiceFooter">
      <div>
        <a className="devoiceBrand" href={localizedPath(locale)}>
          <span className="devoiceLogo" aria-hidden="true">
            <Image src="/devoice-assets/devoice-logo.png" alt="" width={24} height={24} />
          </span>
          <span>DeVoice</span>
        </a>
        <p>DeVoice - AI-Powered Audio & Video Transcription[Unlimited]</p>
        <p>Luminous Swallow Technology Co., Limited</p>
        <strong>Contact us</strong>
        <a href="mailto:service@devoice.io">service@devoice.io</a>
        <span className="footerSocials" aria-label="DeVoice social links">
          <a href="https://x.com/DeVoice_io" aria-label="DeVoice on X" rel="noreferrer" target="_blank">
            X
          </a>
          <a href="https://www.youtube.com/@DeVoice_io" aria-label="DeVoice on YouTube" rel="noreferrer" target="_blank">
            <Youtube size={16} aria-hidden="true" />
          </a>
        </span>
      </div>
      {footerGroups.map(([title, links]) => (
        <div key={title}>
          <strong>{title}</strong>
          {links.map((link) => (
            <a href={hrefs[link] ?? localizedPath(locale)} key={link}>
              {link}
            </a>
          ))}
        </div>
      ))}
      <small>Copyright © 2026 DeVoice</small>
    </footer>
  );
}
