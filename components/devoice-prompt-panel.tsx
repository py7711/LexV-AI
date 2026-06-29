"use client";

import { useState } from "react";
import { Loader2, Music2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isUpgradeRequired, notifyUpgradeRequired } from "@/lib/client-errors";
import { localizedPath, type Locale } from "@/lib/i18n";
import type { DeVoiceJobType } from "@/types/devoice-job";

type PromptJobType = Extract<DeVoiceJobType, "ai_music" | "ai_rap" | "rap_lyrics">;

type PromptGenerationPanelProps = {
  sourceType: PromptJobType;
  cta: string;
  locale: Locale;
};

const styleOptions = {
  ai_music: ["Cinematic", "Pop", "Lo-fi", "EDM", "Ambient", "Acoustic"],
  ai_rap: ["Trap", "Boom bap", "Drill", "Melodic", "Old school", "Club"],
  rap_lyrics: ["Trap", "Boom bap", "Storytelling", "Battle rap", "Melodic", "Conscious"]
} as const;

function labels(sourceType: PromptJobType, locale: Locale) {
  const isZh = locale === "zh-cn";
  if (sourceType === "rap_lyrics") {
    return {
      prompt: isZh ? "歌词主题" : "Lyrics prompt",
      placeholder: isZh ? "描述主题、情绪、押韵风格或想写进歌词的故事。" : "Describe the topic, mood, rhyme style, or story you want in the rap lyrics.",
      style: isZh ? "风格" : "Style",
      detail: isZh ? "生成主歌、副歌、桥段和创作摘要。" : "Generate verses, hook, bridge and a writing summary.",
      fileName: "rap-lyrics.txt",
      missing: isZh ? "请输入歌词主题。" : "Enter a lyrics prompt."
    };
  }
  if (sourceType === "ai_rap") {
    return {
      prompt: isZh ? "Rap 提示词" : "Rap prompt",
      placeholder: isZh ? "描述节奏、主题、歌词方向、语言和想要的 Rap 氛围。" : "Describe the beat, theme, lyrics direction, language and rap vibe you want.",
      style: isZh ? "Rap 风格" : "Rap style",
      detail: isZh ? "生成可在线试听和下载的 Rap 音频预览。" : "Generate a rap audio preview for playback and download.",
      fileName: "ai-rap.txt",
      missing: isZh ? "请输入 Rap 提示词。" : "Enter a rap prompt."
    };
  }
  return {
    prompt: isZh ? "音乐提示词" : "Music prompt",
    placeholder: isZh ? "描述类型、情绪、乐器、节奏、时长或使用场景。" : "Describe the genre, mood, instruments, tempo, length or use case.",
    style: isZh ? "音乐风格" : "Music style",
    detail: isZh ? "生成可在线试听和下载的 AI 音乐预览。" : "Generate an AI music audio preview for playback and download.",
    fileName: "ai-music.txt",
    missing: isZh ? "请输入音乐提示词。" : "Enter a music prompt."
  };
}

export function PromptGenerationPanel({ sourceType, cta, locale }: PromptGenerationPanelProps) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const copy = labels(sourceType, locale);
  const options = styleOptions[sourceType];
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>(options[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setMessage(copy.missing);
      return;
    }
    if (sessionStatus !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      setMessage(locale === "zh-cn" ? "请先登录 DeVoice 以生成结果。" : "Please sign in to DeVoice to generate a result.");
      return;
    }

    setIsSubmitting(true);
    setMessage(locale === "zh-cn" ? "正在生成..." : "Generating...");
    try {
      const sourceUrl = `data:text/plain,${encodeURIComponent(`Style: ${style}\nPrompt: ${trimmed}`)}`;
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceUrl,
          fileName: copy.fileName,
          language: locale,
          targetLanguage: style
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (isUpgradeRequired(response.status, data?.error)) notifyUpgradeRequired();
        throw new Error(data?.error ?? (locale === "zh-cn" ? "生成失败，请稍后重试。" : "Generation failed. Please try again."));
      }

      const data = (await response.json()) as { job: { id: string } };
      window.dispatchEvent(new Event("devoice:credits-changed"));
      router.push(localizedPath(locale, `jobs/${data.job.id}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : locale === "zh-cn" ? "生成失败，请稍后重试。" : "Generation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="voicePanel promptPanel">
      <div className="voiceInput">
        <label className="srOnly" htmlFor={`${sourceType}-prompt`}>{copy.prompt}</label>
        <textarea
          id={`${sourceType}-prompt`}
          maxLength={1600}
          onChange={(event) => {
            setPrompt(event.target.value);
            if (message) setMessage("");
          }}
          placeholder={copy.placeholder}
          value={prompt}
        />
        <div className="voiceCounter">{prompt.length} / 1600</div>
      </div>
      <div className="voiceSettings">
        <div className="voiceSelectGrid">
          <label>
            <span>{copy.style}</span>
            <select value={style} onChange={(event) => setStyle(event.target.value)}>
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="customVoiceBadge promptInfo">
          <strong>{sourceType === "rap_lyrics" ? "TXT" : "MP3"}</strong>
          <span>{copy.detail}</span>
          <em>{sourceType === "rap_lyrics" ? "Lyrics + structure" : "Audio preview + record"}</em>
        </div>
        <button className="voiceGenerateButton" disabled={isSubmitting} onClick={submit} type="button">
          {isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : sourceType === "ai_music" ? <Music2 size={18} aria-hidden="true" /> : <Wand2 size={18} aria-hidden="true" />}
          {isSubmitting ? (locale === "zh-cn" ? "生成中..." : "Generating...") : cta}
        </button>
        {message ? <p className="formMessage">{message}</p> : null}
      </div>
    </div>
  );
}
