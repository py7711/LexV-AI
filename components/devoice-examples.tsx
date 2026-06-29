"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { encodeSubtitleTarget } from "@/lib/devoice-subtitle-settings";
import { getDictionary, localizedPath, type Locale } from "@/lib/i18n";
import type { DeVoiceJobType } from "@/types/devoice-job";

type ExampleItem = {
  title: string;
  time: string;
  label: string;
  imageSrc: string;
};

type DeVoiceExamplesProps = {
  examples: ExampleItem[];
  locale: Locale;
  label: string;
  sourceType?: DeVoiceJobType;
};

function exampleUrl(example: ExampleItem, sourceType: DeVoiceJobType) {
  const slug = encodeURIComponent(example.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  if (sourceType.startsWith("youtube_")) {
    return `https://www.youtube.com/watch?v=${slug || "devoice-demo"}`;
  }

  return `local://examples/${encodeURIComponent(example.title)}`;
}

function examplePayload(example: ExampleItem, sourceType: DeVoiceJobType, locale: Locale) {
  const isChineseLocale = locale.startsWith("zh");
  const voiceLanguage = isChineseLocale ? "zh-CN" : "en-GB";
  const voiceId = isChineseLocale ? "ada" : "sonia";
  const targetLanguage =
    sourceType === "youtube_subtitle"
      ? encodeSubtitleTarget(isChineseLocale ? "ZH" : "EN", "srt")
      : isChineseLocale
        ? "EN"
        : "ZH";

  if (sourceType === "text_to_speech" || sourceType === "ai_dubbing") {
    return {
      sourceType,
      sourceUrl: `data:text/plain,${encodeURIComponent(`${sourceType === "ai_dubbing" ? "Dub a short DeVoice script for" : "Generate a short DeVoice voice preview for"}: ${example.title}`)}`,
      fileName: `${example.title}.txt`,
      language: voiceLanguage,
      targetLanguage: voiceId,
      example: true
    };
  }

  if (sourceType === "voice_clone") {
    return {
      sourceType,
      sourceUrl: `data:text/plain,${encodeURIComponent(`Clone a demo voice for: ${example.title}`)}`,
      storageKey: `local://examples/voice-sample-${encodeURIComponent(example.title)}.mp3`,
      fileName: `${example.title} voice sample.mp3`,
      language: voiceLanguage,
      targetLanguage: voiceId,
      example: true
    };
  }

  if (sourceType === "remove_noise") {
    return {
      sourceType,
      storageKey: `local://examples/noisy-${encodeURIComponent(example.title)}.mp3`,
      fileName: `${example.title}.mp3`,
      language: locale,
      targetLanguage,
      example: true
    };
  }

  if (sourceType === "voice_enhance") {
    return {
      sourceType,
      storageKey: `local://examples/voice-enhance-${encodeURIComponent(example.title)}.mp3`,
      fileName: `${example.title} voice.mp3`,
      language: locale,
      targetLanguage,
      example: true
    };
  }

  if (sourceType === "voice_change") {
    return {
      sourceType,
      storageKey: `local://examples/voice-change-${encodeURIComponent(example.title)}.mp3`,
      fileName: `${example.title} voice changer.mp3`,
      language: locale,
      targetLanguage,
      example: true
    };
  }

  if (sourceType === "audio_extract") {
    return {
      sourceType,
      storageKey: `local://examples/video-${encodeURIComponent(example.title)}.mp4`,
      fileName: `${example.title}.mp4`,
      language: locale,
      targetLanguage,
      example: true
    };
  }

  return {
    sourceType,
    sourceUrl: exampleUrl(example, sourceType),
    fileName: sourceType.startsWith("youtube_") ? undefined : `${example.title}.mp3`,
    language: locale,
    targetLanguage,
    example: true
  };
}

export function DeVoiceExamples({ examples, locale, label, sourceType = "speech_to_text" }: DeVoiceExamplesProps) {
  const router = useRouter();
  const { status } = useSession();
  const t = getDictionary(locale).tool;
  const [loadingTitle, setLoadingTitle] = useState("");
  const [message, setMessage] = useState("");

  async function openExample(example: ExampleItem) {
    setMessage("");
    if (status !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      setMessage(t.signInRequired);
      return;
    }

    setLoadingTitle(example.title);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examplePayload(example, sourceType, locale))
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (response.status === 401) {
          window.dispatchEvent(new Event("devoice:open-auth"));
        }
        throw new Error(data?.error ?? "Unable to open example");
      }

      const data = (await response.json()) as { job: { id: string } };
      window.dispatchEvent(new Event("devoice:credits-changed"));
      router.push(localizedPath(locale, `jobs/${data.job.id}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open example");
    } finally {
      setLoadingTitle("");
    }
  }

  return (
    <div className="exampleStrip" aria-label="Examples">
      <button type="button">{label}</button>
      <div>
        {examples.map((example) => (
          <button type="button" key={example.title} className="exampleCard" onClick={() => openExample(example)}>
            <div className="exampleThumb" aria-hidden="true">
              <Image src={example.imageSrc} alt="" width={104} height={104} />
            </div>
            <span>
              <strong>{example.title}</strong>
              <small>{loadingTitle === example.title ? "Opening..." : example.time}</small>
            </span>
          </button>
        ))}
      </div>
      {message ? <p className="formMessage">{message}</p> : null}
    </div>
  );
}
