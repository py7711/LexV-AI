"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { ArrowLeft, Captions, Check, ChevronDown, Clock3, Copy, Download, Gauge, Languages, Maximize2, Minimize2, Minus, PlayCircle, Plus, RefreshCcw, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { parseSubtitleTarget } from "@/lib/devoice-subtitle-settings";
import { getVoiceLabel, getVoiceLanguageLabel } from "@/lib/devoice-voice-settings";
import { dateLocale, isChineseLocale, localizedPath, type Locale } from "@/lib/i18n";

type JobResult = {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  storageKey: string | null;
  fileName: string | null;
  language: string | null;
  targetLanguage: string | null;
  status: string;
  provider: string | null;
  errorMessage: string | null;
  transcript: string | null;
  subtitles: string | null;
  summary: string | null;
  translation: string | null;
  durationSec: number | null;
  costCents: number;
  createdAt: string;
  updatedAt: string;
  audioAssets?: Array<{
    id: string;
    role: string;
    status: string;
    provider: string | null;
    storageKey: string | null;
    publicUrl: string | null;
    fileName: string | null;
    contentType: string | null;
    byteSize: number | null;
    durationSec: number | null;
    segments: Array<{
      id: string;
      index: number;
      startSec: number;
      endSec: number | null;
      durationSec: number | null;
      storageKey: string | null;
      publicUrl: string | null;
      status: string;
    }>;
  }>;
};

type ParsedSummary = {
  summary: string;
  chapters: Array<{ title: string; startSec?: number }>;
  keywords: string[];
};

type ExportLink = {
  format: string;
  label: string;
  primary?: boolean;
};

type ResultView = "transcript" | "summary" | "mindmap" | "subtitles" | "translation";
type TranslationSourceView = "transcript" | "summary" | "subtitles";

type DeVoiceJobResultProps = {
  initialJob: JobResult;
  locale: Locale;
};

type MindMapTransform = {
  scale: number;
  x: number;
  y: number;
};

const translationLanguages = [
  { value: "ZH", label: "Chinese" },
  { value: "EN", label: "English" },
  { value: "ES", label: "Spanish" },
  { value: "FR", label: "French" },
  { value: "DE", label: "German" },
  { value: "JA", label: "Japanese" },
  { value: "KO", label: "Korean" },
  { value: "PT", label: "Portuguese" },
  { value: "IT", label: "Italian" }
];

function initialTranslationLanguage(job: JobResult, isZh: boolean) {
  const normalized = job.targetLanguage?.toUpperCase();
  if (normalized && translationLanguages.some((language) => language.value === normalized)) return normalized;
  return isZh ? "EN" : "ZH";
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function parseSummary(value: string | null): ParsedSummary | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const chapters: ParsedSummary["chapters"] = [];
    if (Array.isArray(parsed.chapters)) {
      for (const item of parsed.chapters) {
        if (!item || typeof item !== "object") continue;
        const chapter = item as Record<string, unknown>;
        const title = String(chapter.title ?? "");
        if (!title) continue;
        chapters.push({
          title,
          startSec: typeof chapter.startSec === "number" ? chapter.startSec : undefined
        });
      }
    }

    return {
      summary: String(parsed.summary ?? parsed.overview ?? value),
      chapters,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map((item) => String(item)) : []
    };
  } catch {
    return {
      summary: value,
      chapters: [],
      keywords: []
    };
  }
}

function formatTimestamp(seconds?: number) {
  if (typeof seconds !== "number") return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function uniqueExportLinks(links: ExportLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.format)) return false;
    seen.add(link.format);
    return true;
  });
}

function textForView(job: JobResult, view: ResultView, parsedSummary: ParsedSummary | null, isZh: boolean) {
  if (view === "summary") return parsedSummary?.summary ?? (isZh ? "摘要生成后会显示在这里。" : "The generated summary will appear here.");
  if (view === "mindmap") return mindMapText(job, parsedSummary, isZh);
  if (view === "subtitles") return job.subtitles ?? (isZh ? "字幕生成后会显示在这里。" : "Generated subtitles will appear here.");
  if (view === "translation") return job.translation ?? (isZh ? "翻译生成后会显示在这里。" : "Generated translation will appear here.");
  return job.transcript ?? (isZh ? "转写完成后会显示在这里。" : "Your transcript will appear here when it is ready.");
}

function exportFormatForView(view: ResultView, subtitleFormat: string | undefined, sourceType?: string) {
  if (view === "summary") return "summary";
  if (view === "mindmap") return "summary";
  if (view === "subtitles") return subtitleFormat?.toLowerCase() ?? "srt";
  if (view === "translation") return "translation";
  if (sourceType === "text_to_speech" || sourceType === "voice_clone" || sourceType === "ai_dubbing" || sourceType === "ai_music" || sourceType === "ai_rap" || sourceType === "voice_enhance" || sourceType === "voice_change" || sourceType === "audio_extract") return "mp3";
  return "transcript";
}

function mindMapText(job: JobResult, parsedSummary: ParsedSummary | null, isZh: boolean) {
  const root = sourceTypeLabel(job.sourceType, isZh);
  const lines = [root];
  if (parsedSummary?.summary) lines.push(`- ${parsedSummary.summary}`);
  for (const chapter of parsedSummary?.chapters ?? []) {
    lines.push(`- ${formatTimestamp(chapter.startSec)} ${chapter.title}`);
  }
  if (parsedSummary?.keywords.length) lines.push(`- ${(isZh ? "关键词" : "Keywords")}: ${parsedSummary.keywords.join(", ")}`);
  return lines.join("\n");
}

function createMindMapNodes(job: JobResult, parsedSummary: ParsedSummary | null, isZh: boolean, compact: boolean) {
  const fallbackTitle = job.fileName ?? job.sourceUrl ?? sourceTypeLabel(job.sourceType, isZh);
  const chapters = parsedSummary?.chapters.length
    ? parsedSummary.chapters
    : [
        { title: isZh ? "结果已生成" : "Result generated", startSec: 0 },
        { title: sourceTypeLabel(job.sourceType, isZh), startSec: 8 }
      ];
  const keywords = parsedSummary?.keywords.slice(0, compact ? 4 : 8) ?? [];
  const summary = parsedSummary?.summary ?? (job.transcript ? job.transcript.slice(0, 180) : fallbackTitle);

  return {
    root: sourceTypeLabel(job.sourceType, isZh),
    summary,
    chapters: chapters.slice(0, compact ? 4 : 6),
    keywords
  };
}

function exportLinksForJob(job: JobResult, subtitleFormat: string | undefined, isZh: boolean): ExportLink[] {
  if (job.sourceType === "text_to_speech" || job.sourceType === "voice_clone" || job.sourceType === "ai_dubbing" || job.sourceType === "ai_music" || job.sourceType === "ai_rap") {
    const recordLabel = job.sourceType === "ai_dubbing"
      ? (isZh ? "配音记录" : "Dubbing record")
      : job.sourceType === "ai_music"
        ? (isZh ? "音乐记录" : "Music record")
        : job.sourceType === "ai_rap"
          ? (isZh ? "Rap 记录" : "Rap record")
          : (isZh ? "文稿" : "Transcript");
    return [
      { format: "mp3", label: isZh ? "下载 MP3" : "Download MP3", primary: true },
      { format: "wav", label: isZh ? "下载 WAV" : "Download WAV" },
      { format: "transcript", label: recordLabel },
      { format: "txt", label: job.sourceType === "text_to_speech" || job.sourceType === "voice_clone" ? (isZh ? "语音记录" : "Voice record") : (isZh ? "处理记录" : "Processing record") },
      { format: "summary", label: isZh ? "摘要" : "Summary" },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "remove_noise") {
    return [
      { format: "wav", label: isZh ? "下载 WAV" : "Download WAV", primary: true },
      { format: "transcript", label: isZh ? "文稿" : "Transcript" },
      { format: "txt", label: isZh ? "清理记录" : "Cleanup record" },
      { format: "summary", label: isZh ? "摘要" : "Summary" },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "voice_enhance") {
    return [
      { format: "mp3", label: isZh ? "下载 MP3" : "Download MP3", primary: true },
      { format: "wav", label: isZh ? "下载 WAV" : "Download WAV" },
      { format: "transcript", label: isZh ? "增强记录" : "Enhancement record" },
      { format: "txt", label: isZh ? "处理记录" : "Processing record" },
      { format: "summary", label: isZh ? "摘要" : "Summary" },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "voice_change") {
    return [
      { format: "mp3", label: isZh ? "下载 MP3" : "Download MP3", primary: true },
      { format: "wav", label: isZh ? "下载 WAV" : "Download WAV" },
      { format: "transcript", label: isZh ? "变声记录" : "Voice-change record" },
      { format: "txt", label: isZh ? "处理记录" : "Processing record" },
      { format: "summary", label: isZh ? "摘要" : "Summary" },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "audio_extract") {
    return [
      { format: "mp3", label: isZh ? "下载 MP3" : "Download MP3", primary: true },
      { format: "wav", label: isZh ? "下载 WAV" : "Download WAV" },
      { format: "transcript", label: isZh ? "提取记录" : "Extraction record" },
      { format: "summary", label: isZh ? "摘要" : "Summary" },
      { format: "txt", label: "TXT" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "youtube_subtitle") {
    const preferredFormat = subtitleFormat?.toLowerCase() ?? "srt";
    return uniqueExportLinks([
      { format: preferredFormat, label: preferredFormat.toUpperCase(), primary: true },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "txt", label: "TXT" },
      { format: "json", label: "JSON" }
    ]);
  }

  if (job.sourceType === "youtube_summary") {
    return [
      { format: "summary", label: isZh ? "摘要" : "Summary", primary: true },
      { format: "transcript", label: isZh ? "文稿" : "Transcript" },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "txt", label: "TXT" },
      { format: "json", label: "JSON" }
    ];
  }

  if (job.sourceType === "youtube_transcript") {
    return [
      { format: "transcript", label: isZh ? "文稿" : "Transcript", primary: true },
      { format: "translation", label: isZh ? "翻译" : "Translation" },
      { format: "txt", label: "TXT" },
      { format: "srt", label: "SRT" },
      { format: "vtt", label: "VTT" },
      { format: "json", label: "JSON" }
    ];
  }

  return [
    { format: "transcript", label: isZh ? "文稿" : "Transcript", primary: true },
    { format: "summary", label: isZh ? "摘要" : "Summary" },
    { format: "translation", label: isZh ? "翻译" : "Translation" },
    { format: "txt", label: "TXT" },
    { format: "srt", label: "SRT" },
    { format: "vtt", label: "VTT" },
    { format: "json", label: "JSON" }
  ];
}

function sourceTypeLabel(sourceType: string, isZh: boolean) {
  const labels: Record<string, [string, string]> = {
    speech_to_text: ["AI Speech to Text", "AI 语音转文字"],
    audio_to_text: ["Audio To Text", "音频转文字"],
    video_to_text: ["Video To Text", "视频转文字"],
    youtube_transcript: ["YouTube Transcript", "YouTube 文稿"],
    youtube_subtitle: ["YouTube Subtitle", "YouTube 字幕"],
    youtube_summary: ["YouTube Video Summary", "YouTube 视频摘要"],
    remove_noise: ["AI Noise Remover", "AI 降噪"],
    voice_enhance: ["AI Voice Enhancer", "AI 人声增强"],
    voice_change: ["AI Voice Changer", "AI 变声器"],
    audio_extract: ["Audio Extractor", "音频提取"],
    ai_dubbing: ["AI Dubbing", "AI 配音"],
    ai_music: ["AI Music", "AI 音乐"],
    ai_rap: ["AI Rap", "AI Rap"],
    rap_lyrics: ["Rap Lyrics", "Rap 歌词"],
    text_to_speech: ["Text To Speech", "文本转语音"],
    voice_clone: ["AI Voice Cloning", "AI 声音克隆"]
  };

  const label = labels[sourceType];
  return label ? label[isZh ? 1 : 0] : sourceType;
}

function processingSteps(job: JobResult, isZh: boolean) {
  if (job.sourceType === "remove_noise") {
    return isZh ? ["添加文件", "上传", "分离", "试听"] : ["Add file", "Upload", "Separate", "Listen"];
  }

  if (job.sourceType === "voice_enhance") {
    return isZh ? ["添加文件", "上传", "隔离人声", "下载"] : ["Add file", "Upload", "Isolate voice", "Download"];
  }

  if (job.sourceType === "voice_change") {
    return isZh ? ["添加人声", "上传", "AI 变声", "下载"] : ["Add voice", "Upload", "Change voice", "Download"];
  }

  if (job.sourceType === "audio_extract") {
    return isZh ? ["添加视频", "上传", "提取音频", "下载"] : ["Add video", "Upload", "Extract audio", "Download"];
  }

  if (job.sourceType === "ai_dubbing") {
    return isZh ? ["输入脚本", "选择声音", "生成配音", "下载"] : ["Enter script", "Choose voice", "Generate dubbing", "Download"];
  }

  if (job.sourceType === "ai_music") {
    return isZh ? ["输入提示词", "选择风格", "生成音乐", "下载"] : ["Enter prompt", "Choose style", "Generate music", "Download"];
  }

  if (job.sourceType === "ai_rap") {
    return isZh ? ["输入提示词", "选择风格", "生成 Rap", "下载"] : ["Enter prompt", "Choose style", "Generate rap", "Download"];
  }

  if (job.sourceType === "rap_lyrics") {
    return isZh ? ["输入主题", "选择风格", "生成歌词", "导出"] : ["Enter topic", "Choose style", "Generate lyrics", "Export"];
  }

  if (job.sourceType === "text_to_speech") {
    return isZh ? ["输入文本", "选择声音", "生成语音", "下载"] : ["Enter text", "Choose voice", "Generate", "Download"];
  }

  if (job.sourceType === "voice_clone") {
    return isZh ? ["输入文本", "上传音色", "生成声音", "下载"] : ["Enter text", "Upload sample", "Generate voice", "Download"];
  }

  if (job.sourceType.startsWith("youtube_")) {
    return isZh ? ["粘贴链接", "读取视频", "生成结果", "下载"] : ["Paste link", "Read video", "Generate result", "Download"];
  }

  return isZh ? ["添加文件", "转写", "生成文本", "下载"] : ["Add file", "Transcribe", "Create text", "Download"];
}

function outputSummary(job: JobResult, isZh: boolean) {
  if (job.status === "failed") return isZh ? "处理失败，请返回重新提交。" : "Processing failed. Please go back and submit again.";
  if (job.status !== "completed") return isZh ? "任务处理中，完成后将显示可下载结果。" : "Processing is still running. Downloads will be available when it finishes.";
  if (job.sourceType === "youtube_subtitle") return isZh ? "字幕已准备好，可下载 SRT、VTT 或 TXT。" : "Subtitles are ready. Download SRT, VTT or TXT.";
  if (job.sourceType === "youtube_summary") return isZh ? "摘要、章节和关键词已生成。" : "Summary, chapters and keywords are ready.";
  if (job.sourceType === "remove_noise") return isZh ? "清理后的音频预览已生成，可下载 WAV 和处理记录。" : "Clean audio preview is ready. Download WAV or the cleanup record.";
  if (job.sourceType === "voice_enhance") return isZh ? "增强后的人声预览已生成，可下载 MP3、WAV 和处理记录。" : "Enhanced voice preview is ready. Download MP3, WAV or the processing record.";
  if (job.sourceType === "voice_change") return isZh ? "AI 变声预览已生成，可下载 MP3、WAV 和处理记录。" : "AI voice-changer preview is ready. Download MP3, WAV or the processing record.";
  if (job.sourceType === "audio_extract") return isZh ? "音频已从视频中提取，可在线试听并下载 MP3 或 WAV。" : "Audio has been extracted from the video. Preview it online or download MP3/WAV.";
  if (job.sourceType === "ai_dubbing") {
    return isZh ? "AI 配音已生成，可在线试听并下载 MP3 或 WAV。" : "AI dubbing is ready to preview and download as MP3 or WAV.";
  }
  if (job.sourceType === "ai_music") return isZh ? "AI 音乐预览已生成，可在线试听并下载 MP3 或 WAV。" : "AI music preview is ready to preview and download as MP3 or WAV.";
  if (job.sourceType === "ai_rap") return isZh ? "AI Rap 预览已生成，可在线试听并下载 MP3 或 WAV。" : "AI rap preview is ready to preview and download as MP3 or WAV.";
  if (job.sourceType === "rap_lyrics") return isZh ? "Rap 歌词已生成，可复制、查看摘要并导出。" : "Rap lyrics are ready to copy, review and export.";
  if (job.sourceType === "text_to_speech" || job.sourceType === "voice_clone") {
    return isZh ? "语音结果已生成，可在线试听并下载。" : "Voice output is ready to preview and download.";
  }
  return isZh ? "文稿、字幕和翻译结果已准备好。" : "Transcript, subtitles and translation outputs are ready.";
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DeVoiceJobResult({ initialJob, locale }: DeVoiceJobResultProps) {
  const [job, setJob] = useState(initialJob);
  const [pollMessage, setPollMessage] = useState("");
  const [activeView, setActiveView] = useState<ResultView>("transcript");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [mindMapCompact, setMindMapCompact] = useState(false);
  const [mindMapFullscreen, setMindMapFullscreen] = useState(false);
  const [mindMapTransform, setMindMapTransform] = useState<MindMapTransform>({ scale: 1, x: 0, y: 0 });
  const [translationTarget, setTranslationTarget] = useState(() => initialTranslationLanguage(initialJob, isChineseLocale(locale)));
  const [translationSource, setTranslationSource] = useState<TranslationSourceView>("transcript");
  const [isTranslating, setIsTranslating] = useState(false);
  const mindMapDragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const isZh = isChineseLocale(locale);
  const parsedSummary = useMemo(() => parseSummary(job.summary), [job.summary]);
  const mindMap = useMemo(() => createMindMapNodes(job, parsedSummary, isZh, mindMapCompact), [job, parsedSummary, isZh, mindMapCompact]);
  const title = job.fileName ?? job.sourceUrl ?? job.id;
  const isPending = job.status === "queued" || job.status === "processing";
  const isVoiceJob = job.sourceType === "text_to_speech" || job.sourceType === "voice_clone" || job.sourceType === "ai_dubbing" || job.sourceType === "ai_music" || job.sourceType === "ai_rap";
  const isDubbingJob = job.sourceType === "ai_dubbing";
  const isMusicJob = job.sourceType === "ai_music";
  const isRapJob = job.sourceType === "ai_rap";
  const isNoiseJob = job.sourceType === "remove_noise";
  const isVoiceEnhanceJob = job.sourceType === "voice_enhance";
  const isVoiceChangeJob = job.sourceType === "voice_change";
  const isAudioExtractJob = job.sourceType === "audio_extract";
  const isSubtitleJob = job.sourceType === "youtube_subtitle";
  const subtitleSettings = isSubtitleJob ? parseSubtitleTarget(job.targetLanguage) : null;
  const exportLinks = exportLinksForJob(job, subtitleSettings?.format, isZh);
  const activeText = textForView(job, activeView, parsedSummary, isZh);
  const activeFormat = selectedFormat || exportFormatForView(activeView, subtitleSettings?.format, job.sourceType);
  const viewTabs: Array<{ value: ResultView; label: string; disabled?: boolean }> = [
    { value: "transcript", label: isZh ? "文稿" : "Transcript" },
    { value: "summary", label: isZh ? "摘要" : "Summary" },
    { value: "mindmap", label: isZh ? "思维导图" : "Mind Map" },
    { value: "subtitles", label: isZh ? "字幕" : "Subtitles" },
    { value: "translation", label: isZh ? "翻译" : "Translation" }
  ];
  const href = (path = "") => localizedPath(locale, path);
  const steps = processingSteps(job, isZh);

  useEffect(() => {
    setSelectedFormat(exportFormatForView(activeView, subtitleSettings?.format, job.sourceType));
  }, [activeView, subtitleSettings?.format, job.sourceType]);

  useEffect(() => {
    if (!isPending) return;

    const controller = new AbortController();
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { job: JobResult };
        setJob(data.job);
        setPollMessage(isZh ? "结果已刷新" : "Result refreshed");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setPollMessage(isZh ? "刷新失败，稍后会自动重试。" : "Refresh failed. Retrying shortly.");
        }
      }
    }, 2500);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [isPending, isZh, job.id]);

  async function refreshNow() {
    setPollMessage(isZh ? "刷新中..." : "Refreshing...");
    const response = await fetch(`/api/jobs/${job.id}`);
    if (!response.ok) {
      setPollMessage(isZh ? "刷新失败" : "Refresh failed");
      return;
    }

    const data = (await response.json()) as { job: JobResult };
    setJob(data.job);
    setPollMessage(isZh ? "已更新到最新状态" : "Updated to the latest status");
  }

  async function copyTranscript() {
    if (!job.transcript) return;
    await navigator.clipboard.writeText(job.transcript);
    setPollMessage(isZh ? "已复制文本" : "Transcript copied");
  }

  async function copyValue(value: string | null, label: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setPollMessage(isZh ? `已复制${label}` : `${label} copied`);
  }

  async function copyActiveView() {
    await navigator.clipboard.writeText(activeText);
    const label = viewTabs.find((tab) => tab.value === activeView)?.label ?? (isZh ? "结果" : "Result");
    setPollMessage(isZh ? `已复制${label}` : `${label} copied`);
  }

  async function generateTranslation() {
    setIsTranslating(true);
    setPollMessage(isZh ? "正在生成翻译..." : "Generating translation...");

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "translate",
          targetLanguage: translationTarget,
          sourceView: translationSource
        })
      });
      const data = (await response.json().catch(() => null)) as { job?: JobResult; error?: string; translation?: { provider?: string } } | null;
      if (!response.ok || !data?.job) {
        throw new Error(data?.error ?? (isZh ? "翻译失败" : "Translation failed"));
      }

      setJob(data.job);
      setSelectedFormat("translation");
      setPollMessage(
        data.translation?.provider
          ? isZh
            ? `翻译已生成：${data.translation.provider}`
            : `Translation generated: ${data.translation.provider}`
          : isZh
            ? "翻译已生成"
            : "Translation generated"
      );
    } catch (error) {
      setPollMessage(error instanceof Error ? error.message : isZh ? "翻译失败" : "Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }

  function zoomMindMap(delta: number) {
    setMindMapTransform((current) => ({
      ...current,
      scale: Math.min(1.8, Math.max(0.7, Number((current.scale + delta).toFixed(2))))
    }));
  }

  function resetMindMapTransform() {
    setMindMapTransform({ scale: 1, x: 0, y: 0 });
  }

  function handleMindMapPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    mindMapDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: mindMapTransform.x,
      originY: mindMapTransform.y
    };
  }

  function handleMindMapPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mindMapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextX = drag.originX + event.clientX - drag.startX;
    const nextY = drag.originY + event.clientY - drag.startY;
    setMindMapTransform((current) => ({ ...current, x: nextX, y: nextY }));
  }

  function finishMindMapDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (mindMapDragRef.current?.pointerId === event.pointerId) {
      mindMapDragRef.current = null;
    }
  }

  function handleMindMapWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomMindMap(event.deltaY > 0 ? -0.08 : 0.08);
  }

  function downloadMindMap() {
    const svg = document.querySelector(".simple-mindmap-viewport svg");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `devoice-${job.id}-mindmap.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setPollMessage(isZh ? "思维导图已下载" : "Mind map downloaded");
  }

  return (
    <main className="resultPage">
      <section className="resultHeader">
        <div className="dashboardNav">
          <a className="btn" href={href("my-resources")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {isZh ? "返回 My Resources" : "Back to My Resources"}
          </a>
          <div className="exportActions">
            <button className="btn" type="button" onClick={refreshNow}>
              <RefreshCcw size={16} aria-hidden="true" />
              {isZh ? "刷新" : "Refresh"}
            </button>
            <a className="btn btnPrimary" href={`/api/jobs/${job.id}/export?format=${activeFormat}`}>
              <Download size={16} aria-hidden="true" />
              {isZh ? "下载当前结果" : "Download current"}
            </a>
            <details className="downloadMenu">
              <summary>
                {isZh ? "更多格式" : "More formats"}
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div>
                {exportLinks.map((link) => (
                  <a className={link.format === activeFormat ? "isActiveDownload" : ""} href={`/api/jobs/${job.id}/export?format=${link.format}`} key={link.format}>
                    {link.format === activeFormat ? <Check size={14} aria-hidden="true" /> : null}
                    {link.label}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </div>
        <div className="resultTitle">
          <span className="eyebrow">
            <Sparkles size={18} aria-hidden="true" />
            {isZh ? "DeVoice Result" : "DeVoice Result"}
          </span>
          <h1>{title}</h1>
          <p className="lead">
            {isZh ? "查看转写、摘要、字幕和翻译，并导出你需要的格式。" : "Review the transcript, summary, subtitles and translation, then export the format you need."}
          </p>
          <div className="workspaceBar">
            <span>
              <Gauge size={16} aria-hidden="true" />
              {job.status}
            </span>
            <span>
              <Languages size={16} aria-hidden="true" />
              {isVoiceJob
                ? `${getVoiceLanguageLabel(job.language)} / ${getVoiceLabel(job.targetLanguage)}`
                : isSubtitleJob
                  ? `${subtitleSettings?.language ?? "-"} / ${subtitleSettings?.format ?? "SRT"}`
                : `${job.language ?? "-"} -> ${job.targetLanguage ?? "-"}`}
            </span>
            <span>
              <Clock3 size={16} aria-hidden="true" />
              {formatDate(job.createdAt, locale)}
            </span>
          </div>
          {isPending ? <p className="formMessage">{isZh ? "任务处理中，页面会自动刷新。" : "Processing. This page refreshes automatically."}</p> : null}
          {job.errorMessage ? <p className="formError">{job.errorMessage}</p> : null}
          {pollMessage ? <p className="formMessage">{pollMessage}</p> : null}
        </div>
      </section>

      <section className="resultContent">
        <div className="resultHeroGrid">
          <article className="transcriptPanel">
            <div className="tableHeader compactHeader">
              <div>
                <h2>{viewTabs.find((tab) => tab.value === activeView)?.label}</h2>
                <p>{isZh ? "切换结果、选择格式，然后下载或复制。" : "Switch result views, choose a format, then download or copy."}</p>
              </div>
              <Captions size={20} aria-hidden="true" />
            </div>
            <div className="resultWorkbenchToolbar">
              <div className="resultSwitch" role="tablist" aria-label={isZh ? "结果视图" : "Result views"}>
                {viewTabs.map((tab) => (
                  <button
                    aria-selected={activeView === tab.value}
                    className={activeView === tab.value ? "isActiveResultView" : ""}
                    key={tab.value}
                    onClick={() => setActiveView(tab.value)}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="resultFormatControls">
                <label>
                  {isZh ? "格式" : "Format"}
                  <select className="themeSelect" value={activeFormat} onChange={(event) => setSelectedFormat(event.target.value)}>
                    {exportLinks.map((link) => (
                      <option key={link.format} value={link.format}>
                        {link.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn" type="button" onClick={copyActiveView}>
                  <Copy size={16} aria-hidden="true" />
                  {isZh ? "复制当前" : "Copy current"}
                </button>
                <a className="btn btnPrimary" href={`/api/jobs/${job.id}/export?format=${activeFormat}`}>
                  <Download size={16} aria-hidden="true" />
                  {isZh ? "下载" : "Download"}
                </a>
              </div>
            </div>
            {activeView === "summary" ? (
              <div className="resultBox summaryContent">
                <p>{parsedSummary?.summary ?? activeText}</p>
                {parsedSummary?.chapters.length ? (
                  <ol className="summaryList">
                    {parsedSummary.chapters.map((chapter) => (
                      <li key={`${chapter.title}-${chapter.startSec ?? "na"}`}>
                        <button className="summaryTimestamp" type="button" onClick={() => setPollMessage(`${formatTimestamp(chapter.startSec)} ${chapter.title}`)}>
                          {formatTimestamp(chapter.startSec)}
                        </button>
                        {chapter.title}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {parsedSummary?.keywords.length ? (
                  <div className="keywordList">
                    {parsedSummary.keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : activeView === "mindmap" ? (
              <div className={`resultBox simple-mindmap-panel ${mindMapFullscreen ? "mindmap-shell--pseudo-fullscreen" : ""}`}>
                <div className="mindmapToolbar">
                  <div>
                    <strong>{isZh ? "思维导图" : "Mind Map"}</strong>
                    <span>{isZh ? "从摘要、章节和关键词生成" : "Generated from summary, chapters and keywords"}</span>
                  </div>
                  <label className="themeSwitchLabel">
                    <span>{isZh ? "紧凑" : "Compact"}</span>
                    <button
                      aria-pressed={mindMapCompact}
                      className={`theme-switch ${mindMapCompact ? "is-checked" : ""}`}
                      onClick={() => setMindMapCompact((current) => !current)}
                      type="button"
                    >
                      <span className="themeSwitchCore">
                        <span className="themeSwitchAction" />
                      </span>
                    </button>
                  </label>
                  <button className="btn" onClick={() => setMindMapFullscreen((current) => !current)} type="button">
                    {mindMapFullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
                    {mindMapFullscreen ? (isZh ? "退出" : "Exit") : (isZh ? "全屏" : "Fullscreen")}
                  </button>
                  <div className="mindmapZoomControls" aria-label={isZh ? "导图缩放" : "Mind map zoom"}>
                    <button aria-label={isZh ? "缩小导图" : "Zoom out"} className="btn" onClick={() => zoomMindMap(-0.1)} type="button">
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span>{Math.round(mindMapTransform.scale * 100)}%</span>
                    <button aria-label={isZh ? "放大导图" : "Zoom in"} className="btn" onClick={() => zoomMindMap(0.1)} type="button">
                      <Plus size={15} aria-hidden="true" />
                    </button>
                    <button aria-label={isZh ? "重置导图" : "Reset mind map"} className="btn" onClick={resetMindMapTransform} type="button">
                      <RotateCcw size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <button className="btn btnPrimary" onClick={downloadMindMap} type="button">
                    <Download size={16} aria-hidden="true" />
                    SVG
                  </button>
                </div>
                <div
                  className="simple-mindmap-viewport"
                  data-scale={mindMapTransform.scale.toFixed(2)}
                  data-x={Math.round(mindMapTransform.x)}
                  data-y={Math.round(mindMapTransform.y)}
                  onPointerCancel={finishMindMapDrag}
                  onPointerDown={handleMindMapPointerDown}
                  onPointerMove={handleMindMapPointerMove}
                  onPointerUp={finishMindMapDrag}
                  onWheel={handleMindMapWheel}
                  role="img"
                  aria-label={isZh ? "结果思维导图，可拖拽缩放" : "Result mind map, draggable and zoomable"}
                >
                  <svg
                    className="simple-mindmap-canvas"
                    style={{ transform: `translate(${mindMapTransform.x}px, ${mindMapTransform.y}px) scale(${mindMapTransform.scale})` }}
                    viewBox="0 0 980 520"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <filter id={`mindmapGlow-${job.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <line className="mindmapLine" x1="250" y1="260" x2="470" y2="150" />
                    <line className="mindmapLine" x1="250" y1="260" x2="470" y2="260" />
                    <line className="mindmapLine" x1="250" y1="260" x2="470" y2="370" />
                    <g className="smm-node mindmapNode mindmapRoot" transform="translate(48 210)">
                      <rect width="300" height="100" rx="18" />
                      <text x="24" y="42">{mindMap.root}</text>
                      <text className="mindmapSmall" x="24" y="70">{job.status}</text>
                    </g>
                    <g className="smm-node mindmapNode" transform="translate(470 76)">
                      <rect width="440" height="112" rx="16" />
                      <text x="22" y="36">{isZh ? "摘要" : "Summary"}</text>
                      <foreignObject x="22" y="50" width="390" height="50">
                        <div className="mindmapSummaryText">
                          <p>{mindMap.summary}</p>
                        </div>
                      </foreignObject>
                    </g>
                    <g className="smm-node mindmapNode" transform="translate(470 215)">
                      <rect width="440" height="108" rx="16" />
                      <text x="22" y="34">{isZh ? "章节" : "Chapters"}</text>
                      {mindMap.chapters.slice(0, 3).map((chapter, index) => (
                        <text className="mindmapSmall" x="22" y={58 + index * 20} key={`${chapter.title}-${index}`}>
                          {formatTimestamp(chapter.startSec)} {chapter.title.slice(0, 52)}
                        </text>
                      ))}
                    </g>
                    <g className="smm-node mindmapNode" transform="translate(470 352)">
                      <rect width="440" height="98" rx="16" />
                      <text x="22" y="34">{isZh ? "关键词" : "Keywords"}</text>
                      <foreignObject x="22" y="48" width="390" height="38">
                        <div className="mindmapKeywords">
                          {(mindMap.keywords.length ? mindMap.keywords : [sourceTypeLabel(job.sourceType, isZh)]).map((keyword) => (
                            <span key={keyword}>{keyword}</span>
                          ))}
                        </div>
                      </foreignObject>
                    </g>
                  </svg>
                </div>
              </div>
            ) : activeView === "translation" ? (
              <div className="resultBox translationWorkbench resultSwitchPane">
                <div className="translationControls">
                  <label>
                    {isZh ? "目标语言" : "Target language"}
                    <select className="themeSelect" value={translationTarget} onChange={(event) => setTranslationTarget(event.target.value)}>
                      {translationLanguages.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {isZh ? "翻译来源" : "Translate from"}
                    <select className="themeSelect" value={translationSource} onChange={(event) => setTranslationSource(event.target.value as TranslationSourceView)}>
                      <option value="transcript">{isZh ? "文稿" : "Transcript"}</option>
                      <option value="summary">{isZh ? "摘要" : "Summary"}</option>
                      <option value="subtitles">{isZh ? "字幕" : "Subtitles"}</option>
                    </select>
                  </label>
                  <button className="btn btnPrimary" type="button" onClick={generateTranslation} disabled={isTranslating}>
                    <Languages size={16} aria-hidden="true" />
                    {isTranslating ? (isZh ? "生成中..." : "Generating...") : (isZh ? "生成翻译" : "Generate translation")}
                  </button>
                  <button className="btn" type="button" onClick={() => copyValue(job.translation, isZh ? "翻译" : "Translation")} disabled={!job.translation || isTranslating}>
                    <Copy size={16} aria-hidden="true" />
                    {isZh ? "复制翻译" : "Copy translation"}
                  </button>
                </div>
                {isTranslating ? (
                  <div className="translationSkeleton" aria-live="polite">
                    <span className="summary-skeleton" />
                    <span className="summary-skeleton" />
                    <span className="summary-skeleton" />
                  </div>
                ) : (
                  <pre>{job.translation ?? (isZh ? "选择目标语言并生成翻译。" : "Choose a target language and generate a translation.")}</pre>
                )}
              </div>
            ) : (
              <pre className="resultBox resultSwitchPane" key={activeView}>
                {activeText}
              </pre>
            )}
          </article>

          <aside className="resultSidePanel">
            <article>
              <h2>{isZh ? "Summary" : "Summary"}</h2>
              <p>{parsedSummary?.summary ?? (isZh ? "摘要生成后会显示在这里。" : "The generated summary will appear here.")}</p>
              {parsedSummary?.chapters.length ? (
                <ol className="summaryList">
                  {parsedSummary.chapters.map((chapter) => (
                    <li key={`${chapter.title}-${chapter.startSec ?? "na"}`}>
                      <span>{formatTimestamp(chapter.startSec)}</span>
                      {chapter.title}
                    </li>
                  ))}
                </ol>
              ) : null}
              {parsedSummary?.keywords.length ? (
                <div className="keywordList">
                  {parsedSummary.keywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              ) : null}
            </article>
            <article>
              <h2>{isZh ? "Download" : "Download"}</h2>
              <div className="downloadButtons">
                {exportLinks.map((link) => (
                  <a className={link.primary ? "btn btnPrimary" : "btn"} href={`/api/jobs/${job.id}/export?format=${link.format}`} key={link.format}>
                    {link.primary ? <Download size={16} aria-hidden="true" /> : null}
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
            <article>
              <h2>{isZh ? "Copy" : "Copy"}</h2>
              <div className="downloadButtons">
                <button className="btn" type="button" onClick={copyTranscript} disabled={!job.transcript}>
                  <Copy size={16} aria-hidden="true" />
                  {isZh ? "文稿" : "Transcript"}
                </button>
                <button className="btn" type="button" onClick={() => copyValue(parsedSummary?.summary ?? job.summary, isZh ? "摘要" : "Summary")} disabled={!job.summary}>
                  <Copy size={16} aria-hidden="true" />
                  {isZh ? "摘要" : "Summary"}
                </button>
                <button className="btn" type="button" onClick={() => copyValue(job.subtitles, isZh ? "字幕" : "Subtitles")} disabled={!job.subtitles}>
                  <Copy size={16} aria-hidden="true" />
                  {isZh ? "字幕" : "Subtitles"}
                </button>
              </div>
            </article>
            {isVoiceJob || isNoiseJob || isVoiceEnhanceJob || isVoiceChangeJob || isAudioExtractJob ? (
              <article>
                <h2>{isVoiceJob ? (isZh ? "Audio Preview" : "Audio Preview") : isAudioExtractJob ? (isZh ? "Extracted Audio" : "Extracted Audio") : isVoiceEnhanceJob ? (isZh ? "Enhanced Voice" : "Enhanced Voice") : isVoiceChangeJob ? (isZh ? "AI 变声预览" : "Changed Voice") : (isZh ? "Clean Audio" : "Clean Audio")}</h2>
                <div className="mediaPreviewBox">
                  <audio controls src={`/api/jobs/${job.id}/export?format=wav`}>
                    {isZh ? "你的浏览器不支持音频预览。" : "Your browser does not support audio preview."}
                  </audio>
                  {isVoiceJob || isVoiceEnhanceJob || isVoiceChangeJob || isAudioExtractJob ? (
                    <a className="btn btnPrimary" href={`/api/jobs/${job.id}/export?format=mp3`}>
                      <Download size={16} aria-hidden="true" />
                      {isZh ? "下载 MP3" : "Download MP3"}
                    </a>
                  ) : null}
                  <a className={isVoiceJob || isVoiceEnhanceJob || isVoiceChangeJob ? "btn" : "btn btnPrimary"} href={`/api/jobs/${job.id}/export?format=wav`}>
                    <PlayCircle size={16} aria-hidden="true" />
                    {isZh ? "下载 WAV" : "Download WAV"}
                  </a>
                  <button className="btn" type="button" onClick={copyTranscript} disabled={!job.transcript}>
                    <Copy size={16} aria-hidden="true" />
                    {isZh ? "复制结果" : "Copy result"}
                  </button>
                  <a className="btn" href={`/api/jobs/${job.id}/export?format=txt`}>
                    <Wand2 size={16} aria-hidden="true" />
                    {isMusicJob ? (isZh ? "下载音乐记录" : "Download music record") : isRapJob ? (isZh ? "下载 Rap 记录" : "Download rap record") : isDubbingJob ? (isZh ? "下载配音记录" : "Download dubbing record") : isVoiceJob ? (isZh ? "下载语音记录" : "Download voice record") : isVoiceEnhanceJob ? (isZh ? "下载增强记录" : "Download enhancement record") : isVoiceChangeJob ? (isZh ? "下载变声记录" : "Download voice-change record") : isAudioExtractJob ? (isZh ? "下载提取记录" : "Download extraction record") : (isZh ? "下载清理记录" : "Download cleanup record")}
                  </a>
                </div>
              </article>
            ) : null}
            <article>
              <h2>{isZh ? "Processing" : "Processing"}</h2>
              <div className="resultSteps" aria-label={isZh ? "处理步骤" : "Processing steps"}>
                {steps.map((step, index) => (
                  <span className={job.status === "completed" || index === 0 ? "stepDone" : ""} key={step}>
                    <strong>{index + 1}</strong>
                    {step}
                  </span>
                ))}
              </div>
              <div className="metaList">
                <span>{isZh ? "类型" : "Type"}: {sourceTypeLabel(job.sourceType, isZh)}</span>
                <span>{isZh ? "状态" : "Status"}: {job.status}</span>
                <span>{isZh ? "更新时间" : "Updated"}: {formatDate(job.updatedAt, locale)}</span>
              </div>
              <p>{outputSummary(job, isZh)}</p>
            </article>
            {job.audioAssets?.length ? (
              <article>
                <h2>{isZh ? "音频资产" : "Audio Assets"}</h2>
                <div className="audioAssetList">
                  {job.audioAssets.map((asset) => (
                    <div className="audioAssetItem" key={asset.id}>
                      <strong>{asset.role.replace(/_/g, " ")}</strong>
                      <span>{asset.status} · {asset.contentType ?? "audio"} · {formatBytes(asset.byteSize)}</span>
                      <small>{asset.storageKey ?? asset.publicUrl ?? asset.fileName ?? asset.id}</small>
                      {asset.segments.length ? (
                        <em>
                          {isZh ? "切片" : "Segments"}: {asset.segments.length} · {asset.segments.filter((segment) => segment.status === "ready").length} ready
                        </em>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </aside>
        </div>

        <div className="resultGrid">
          <article className="opsPanel">
            <h2>{isZh ? "Subtitles" : "Subtitles"}</h2>
            <pre className="resultBox">{job.subtitles ?? (isZh ? "字幕生成后会显示在这里。" : "Generated subtitles will appear here.")}</pre>
          </article>
          <article className="opsPanel">
            <h2>{isZh ? "Translation" : "Translation"}</h2>
            <pre className="resultBox">{job.translation ?? (isZh ? "翻译生成后会显示在这里。" : "Generated translation will appear here.")}</pre>
          </article>
        </div>
      </section>
    </main>
  );
}
