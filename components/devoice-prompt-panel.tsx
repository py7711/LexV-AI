"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Loader2, Music2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isUpgradeRequired, notifyUpgradeRequired } from "@/lib/client-errors";
import { localizedPath, type Locale } from "@/lib/i18n";
import type { DeVoiceJobType } from "@/types/devoice-job";

type PromptJobType = Extract<DeVoiceJobType, "ai_music" | "ai_rap" | "rap_lyrics">;
type SongJobType = Extract<PromptJobType, "ai_music" | "ai_rap">;

type PromptGenerationPanelProps = {
  sourceType: PromptJobType;
  cta: string;
  locale: Locale;
};

const songStyleOptions = {
  ai_music: ["Pop", "Cinematic", "Lo-fi", "EDM", "Ambient", "Acoustic", "Rock", "Hip Hop"],
  ai_rap: ["Trap", "Boom bap", "Drill", "Melodic", "Old school", "Club", "Freestyle", "Conscious"]
} as const;

const lyricMoodOptions = ["Energetic", "Confident", "Dark", "Romantic", "Chill", "Aggressive", "Hopeful"];
const lyricLanguageOptions = ["English", "Spanish", "French", "German", "Portuguese", "Chinese", "Japanese"];

function usePromptSubmit(sourceType: PromptJobType, locale: Locale) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(input: {
    prompt: string;
    style: string;
    fileName: string;
    missingMessage: string;
  }) {
    const trimmed = input.prompt.trim();
    if (!trimmed) {
      setMessage(input.missingMessage);
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
      const sourceUrl = `data:text/plain,${encodeURIComponent(trimmed)}`;
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceUrl,
          fileName: input.fileName,
          language: locale,
          targetLanguage: input.style
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

  return { isSubmitting, message, setMessage, submit };
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="songGeneratorLabel">
      {children}
      {required ? <em>*</em> : null}
    </span>
  );
}

function pillClass(active: boolean) {
  return active ? "songChoicePill songChoicePillActive" : "songChoicePill";
}

function SongGeneratorPanel({ sourceType, cta, locale }: PromptGenerationPanelProps & { sourceType: SongJobType }) {
  const isRap = sourceType === "ai_rap";
  const isZh = locale === "zh-cn";
  const options = songStyleOptions[sourceType];
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState<string>(options[0]);
  const [voice, setVoice] = useState<"Male" | "Female">("Male");
  const [inputType, setInputType] = useState<"Description" | "Lyrics">("Description");
  const [description, setDescription] = useState("");
  const { isSubmitting, message, setMessage, submit } = usePromptSubmit(sourceType, locale);
  const songTitle = isRap ? (isZh ? "Rap 标题" : "Song Title") : (isZh ? "歌曲标题" : "Song Title");
  const descriptionLabel = isRap ? (isZh ? "Rap 描述" : "Song Description") : (isZh ? "歌曲描述" : "Song Description");
  const placeholder = isZh ? "描述流派、情绪、乐器和主题..." : "Describe genre, mood, instruments, and topic...";
  const titlePlaceholder = isZh ? "例如 Midnight Drive" : "e.g. Midnight Drive";
  const prompt = useMemo(() => {
    return [
      `Title: ${title.trim()}`,
      `Style: ${style}`,
      `Voice: ${voice}`,
      `Input: ${inputType}`,
      "",
      `${inputType}:`,
      description.trim()
    ].join("\n");
  }, [description, inputType, style, title, voice]);

  return (
    <div className={isRap ? "songGeneratorFrame songGeneratorRapFrame" : "songGeneratorFrame"}>
      <div className="songGeneratorForm">
        <label className="songGeneratorField">
          <FieldLabel required>{songTitle}</FieldLabel>
          <input
            maxLength={80}
            onChange={(event) => {
              setTitle(event.target.value);
              if (message) setMessage("");
            }}
            placeholder={titlePlaceholder}
            value={title}
          />
          <small>{title.length}/80</small>
        </label>

        {isRap ? null : (
          <label className="songGeneratorField">
            <FieldLabel required>{isZh ? "风格" : "Style"}</FieldLabel>
            <select value={style} onChange={(event) => setStyle(event.target.value)}>
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        )}

        <div className="songGeneratorSplit">
          <div className="songGeneratorChoice">
            <FieldLabel>{isZh ? "声音" : "Voice"}</FieldLabel>
            <div>
              {(["Male", "Female"] as const).map((item) => (
                <button className={pillClass(voice === item)} key={item} onClick={() => setVoice(item)} type="button">
                  {isZh ? item === "Male" ? "男声" : "女声" : item}
                </button>
              ))}
            </div>
          </div>
          <div className="songGeneratorChoice">
            <FieldLabel required>{isZh ? "输入类型" : "Input Type"}</FieldLabel>
            <div>
              {(["Description", "Lyrics"] as const).map((item) => (
                <button className={pillClass(inputType === item)} key={item} onClick={() => setInputType(item)} type="button">
                  {isZh ? item === "Description" ? "描述" : "歌词" : item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="songGeneratorField">
          <FieldLabel required>{descriptionLabel}</FieldLabel>
          <textarea
            maxLength={200}
            onChange={(event) => {
              setDescription(event.target.value);
              if (message) setMessage("");
            }}
            placeholder={placeholder}
            value={description}
          />
          <small>{description.length}/200</small>
        </label>

        <button
          className="songGeneratorSubmit"
          disabled={isSubmitting}
          onClick={() => submit({
            prompt,
            style,
            fileName: isRap ? "ai-rap.txt" : "ai-music.txt",
            missingMessage: isZh ? "请输入标题和描述。" : "Enter a title and description."
          })}
          type="button"
        >
          {isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : isRap ? <Wand2 size={18} aria-hidden="true" /> : <Music2 size={18} aria-hidden="true" />}
          {isSubmitting ? (isZh ? "生成中..." : "Generating...") : cta}
        </button>
        {message ? <p className="formMessage">{message}</p> : null}
      </div>

      <aside className="songGeneratorPreview" aria-label={isZh ? "会话预览" : "Session Preview"}>
        <h2>{isZh ? "会话预览" : "Session Preview"}</h2>
        <dl>
          <div>
            <dt>{isZh ? "声音" : "Voice"}</dt>
            <dd>{isZh ? voice === "Male" ? "男声" : "女声" : voice}</dd>
          </div>
          <div>
            <dt>{isZh ? "输入" : "Input"}</dt>
            <dd>{isZh ? inputType === "Description" ? "描述" : "歌词" : inputType}</dd>
          </div>
          <div>
            <dt>{isZh ? "标题长度" : "Title length"}</dt>
            <dd>{title.length}/80</dd>
          </div>
          <div>
            <dt>{isZh ? "内容长度" : "Content length"}</dt>
            <dd>{description.length}/200</dd>
          </div>
        </dl>
        <p>{isZh ? "具体的提示通常会带来更好的输出：情绪、速度、乐器和人声语气。" : "Better outputs usually come from specific prompts: mood, tempo, instruments, and vocal tone."}</p>
      </aside>
    </div>
  );
}

function RapLyricsPanel({ sourceType, cta, locale }: PromptGenerationPanelProps) {
  const isZh = locale === "zh-cn";
  const [topic, setTopic] = useState("");
  const [mood, setMood] = useState(lyricMoodOptions[0]);
  const [language, setLanguage] = useState(lyricLanguageOptions[0]);
  const [keywords, setKeywords] = useState("");
  const { isSubmitting, message, setMessage, submit } = usePromptSubmit(sourceType, locale);
  const generatedPreview = topic.trim()
    ? [
        `[${mood} / ${language}]`,
        "",
        "Verse",
        `${topic.trim()} turns into rhythm, pressure into spark,`,
        keywords.trim() ? `Keywords in the pocket: ${keywords.trim()}.` : "Clean bars will appear here after generation.",
        "",
        "Hook",
        "Keep the cadence moving, let the story rise."
      ].join("\n")
    : "";
  const prompt = [
    `Topic: ${topic.trim()}`,
    `Mood: ${mood}`,
    `Language: ${language}`,
    `Keywords: ${keywords.trim()}`
  ].join("\n");

  return (
    <div className="lyricsGeneratorFrame">
      <section className="lyricsGeneratorCard">
        <h2>{isZh ? "输入以生成 Rap 歌词" : "Input to generate rap lyrics"}</h2>
        <label className="songGeneratorField">
          <FieldLabel required>{isZh ? "歌曲主题" : "Song Topic"}</FieldLabel>
          <input
            onChange={(event) => {
              setTopic(event.target.value);
              if (message) setMessage("");
            }}
            placeholder={isZh ? "例如 街头梦想与野心" : "e.g. Street dreams and ambition"}
            value={topic}
          />
        </label>
        <div className="lyricsGeneratorGrid">
          <label className="songGeneratorField">
            <FieldLabel>{isZh ? "歌曲情绪" : "Song Mood"}</FieldLabel>
            <select value={mood} onChange={(event) => setMood(event.target.value)}>
              {lyricMoodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="songGeneratorField">
            <FieldLabel>{isZh ? "歌曲语言" : "Song Language"}</FieldLabel>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {lyricLanguageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <label className="songGeneratorField">
          <FieldLabel>{isZh ? "歌曲词汇" : "Song Words"} <span>{isZh ? "（可选）" : "(Optional)"}</span></FieldLabel>
          <input
            onChange={(event) => setKeywords(event.target.value)}
            placeholder={isZh ? "可选关键词" : "Optional keywords to include"}
            value={keywords}
          />
        </label>
        <button
          className={topic.trim() ? "songGeneratorSubmit" : "songGeneratorSubmit lyricsGeneratorSubmitEmpty"}
          disabled={isSubmitting}
          onClick={() => submit({
            prompt,
            style: `${mood}/${language}`,
            fileName: "rap-lyrics.txt",
            missingMessage: isZh ? "请输入歌曲主题。" : "Enter a song topic."
          })}
          type="button"
        >
          {isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : <Wand2 size={18} aria-hidden="true" />}
          {isSubmitting ? (isZh ? "生成中..." : "Generating...") : cta}
        </button>
        {message ? <p className="formMessage">{message}</p> : null}
      </section>
      <section className="lyricsGeneratorCard">
        <h2>{isZh ? "生成的 Rap 歌词" : "Generated Rap Lyrics"}</h2>
        <pre>{generatedPreview || (isZh ? "生成的歌词将显示在这里" : "Your generated lyrics will appear here")}</pre>
      </section>
    </div>
  );
}

export function PromptGenerationPanel(props: PromptGenerationPanelProps) {
  if (props.sourceType === "rap_lyrics") {
    return <RapLyricsPanel {...props} />;
  }

  return <SongGeneratorPanel cta={props.cta} locale={props.locale} sourceType={props.sourceType} />;
}
