"use client";

import { useState } from "react";
import { AudioLines, FileText, FileUp, Headphones, Languages, Link2, Play, Speech, Upload, UploadCloud, Volume2, VolumeX, Youtube } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { devoiceSubtitleFormats, encodeSubtitleTarget } from "@/lib/devoice-subtitle-settings";
import { devoiceVoiceLanguages, devoiceVoices } from "@/lib/devoice-voice-settings";
import { isYoutubeUrl } from "@/lib/devoice-youtube";
import { getDictionary, isChineseLocale, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { isUpgradeRequired, notifyUpgradeRequired } from "@/lib/client-errors";
import type { DeVoiceJobType } from "@/types/devoice-job";

type JobFormProps = {
  title: string;
  help: string;
  placeholder: string;
  buttonLabel: string;
  locale: string;
  defaultJobType?: DeVoiceJobType;
  youtubeOnly?: boolean;
  dedicatedTool?: boolean;
};

type UploadResponse = {
  upload: {
    mode?: "r2" | "local";
    storageKey: string;
    uploadUrl: string | null;
    publicUrl?: string;
    message?: string;
  };
};

type JobResponse = {
  job: { id: string };
  queue?: { queued: boolean; reason?: string };
};

function youtubeActionLabel(sourceType: DeVoiceJobType, t: ReturnType<typeof getDictionary>["tool"]) {
  if (sourceType === "youtube_subtitle") return t.downloadSubtitle;
  if (sourceType === "youtube_summary") return t.summarizeVideo;
  if (sourceType === "youtube_transcript") return t.getTranscript;
  return t.getTranscript;
}

function youtubeHelpLabel(sourceType: DeVoiceJobType, t: ReturnType<typeof getDictionary>["tool"]) {
  if (sourceType === "youtube_subtitle") return t.youtubeSubtitleHelp;
  if (sourceType === "youtube_summary") return t.youtubeSummaryHelp;
  if (sourceType === "youtube_transcript") return t.youtubeTranscriptHelp;
  return t.youtubeHelp;
}

function youtubeFormatHint(sourceType: DeVoiceJobType, t: ReturnType<typeof getDictionary>["tool"]) {
  if (sourceType === "youtube_subtitle") return t.youtubeSubtitleHint;
  if (sourceType === "youtube_summary") return t.youtubeSummaryHint;
  if (sourceType === "youtube_transcript") return t.youtubeTranscriptHint;
  return t.formats;
}

function isTranscriptionTool(sourceType: DeVoiceJobType) {
  return sourceType === "speech_to_text" || sourceType === "audio_to_text" || sourceType === "video_to_text";
}

export function JobForm({ title, help, placeholder, buttonLabel, locale, defaultJobType = "speech_to_text", youtubeOnly = false, dedicatedTool = false }: JobFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const currentLocale: Locale = isLocale(locale) ? locale : "en";
  const t = getDictionary(currentLocale).tool;
  const [mode, setMode] = useState<"link" | "file">(youtubeOnly ? "link" : "file");
  const [tool, setTool] = useState<DeVoiceJobType>(defaultJobType);
  const [sourceUrl, setSourceUrl] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(isChineseLocale(currentLocale) ? "EN" : "ZH");
  const [voiceLanguage, setVoiceLanguage] = useState(isChineseLocale(currentLocale) ? "zh-CN" : "en-GB");
  const [voiceId, setVoiceId] = useState(isChineseLocale(currentLocale) ? "ada" : "sonia");
  const [subtitleFormat, setSubtitleFormat] = useState("srt");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubtitleDownloader = defaultJobType === "youtube_subtitle";
  const YoutubeSubmitIcon = defaultJobType === "youtube_transcript" ? FileText : Link2;
  const youtubeButtonLabel = youtubeActionLabel(defaultJobType, t);
  const sourceYoutubeHeroButtonLabel = t.getTranscript;
  const currentYoutubeHelp = youtubeHelpLabel(defaultJobType, t);
  const currentFormatHint = youtubeOnly ? youtubeFormatHint(defaultJobType, t) : t.formats;
  const linkModeLabel = t.youtubeUrl;
  const fileAccept = defaultJobType === "audio_extract" ? "video/*" : "audio/*,video/*";

  async function createJob(payload: Record<string, unknown>) {
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (isUpgradeRequired(response.status, data?.error)) {
        notifyUpgradeRequired();
      }
      throw new Error(data?.error ?? t.checkInput);
    }

    return (await response.json()) as JobResponse;
  }

  async function submitLinkJob() {
    if (!sourceUrl) {
      throw new Error(t.pasteLinkFirst);
    }

    const isYoutubeLink = isYoutubeUrl(sourceUrl);
    if (youtubeOnly && !isYoutubeLink) {
      throw new Error(t.validYoutubeUrl);
    }

    return createJob({
      sourceUrl,
      sourceType: youtubeOnly
        ? defaultJobType
        : isYoutubeLink && isTranscriptionTool(tool)
          ? "youtube_transcript"
          : tool,
      language: locale,
      targetLanguage: isSubtitleDownloader ? encodeSubtitleTarget(targetLanguage, subtitleFormat) : targetLanguage
    });
  }

  async function submitTextToSpeechJob() {
    if (!voiceText.trim()) {
      throw new Error(t.enterTextFirst);
    }

    return createJob({
      sourceType: "text_to_speech",
      sourceUrl: `data:text/plain,${encodeURIComponent(voiceText.trim())}`,
      fileName: "text-to-speech.txt",
      language: voiceLanguage,
      targetLanguage: voiceId
    });
  }

  async function submitFileJob(selectedFile = file) {
    if (!selectedFile) {
      throw new Error(t.chooseFileFirst);
    }

    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream"
      })
    });

    if (!uploadResponse.ok) {
      const data = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? t.prepareUploadError);
    }

    const { upload } = (await uploadResponse.json()) as UploadResponse;
    if (!upload.uploadUrl) {
      throw new Error(t.prepareUploadError);
    }

    const putResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": selectedFile.type || "application/octet-stream"
      },
      body: selectedFile
    });

    if (!putResponse.ok) {
      throw new Error(`${t.uploadFailed}: HTTP ${putResponse.status}`);
    }

    return createJob({
      sourceType: youtubeOnly ? "speech_to_text" : tool,
      storageKey: upload.storageKey,
      sourceUrl: upload.publicUrl,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      contentType: selectedFile.type || "application/octet-stream",
      language: locale,
      targetLanguage
    });
  }

  async function submitJob(selectedFile?: File) {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (status !== "authenticated") {
        window.dispatchEvent(new Event("devoice:open-auth"));
        throw new Error(t.signInRequired);
      }

      const data = tool === "text_to_speech" ? await submitTextToSpeechJob() : mode === "link" ? await submitLinkJob() : await submitFileJob(selectedFile);
      const queuedText = data.queue?.queued ? t.queued : data.queue?.reason;
      setMessage(`${t.created}: ${data.job.id}, ${queuedText ?? t.waiting}`);
      setSourceUrl("");
      setVoiceText("");
      setFile(null);
      window.dispatchEvent(new Event("devoice:credits-changed"));
      router.push(localizedPath(currentLocale, `jobs/${data.job.id}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.checkInput);
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || (tool === "text_to_speech" ? !voiceText.trim() : mode === "link" ? !sourceUrl : !file);

  if (youtubeOnly) {
    return (
      <div className="uploadPanel devoiceUploader youtubePanel" aria-label={title}>
        <div className="youtubeModeSwitch" aria-label={t.inputMode}>
          <button className={mode === "file" ? "modeActive" : ""} type="button" onClick={() => setMode("file")} aria-pressed={mode === "file"}>
            <Headphones size={16} aria-hidden="true" />
            {t.videoAudio}
          </button>
          <button className={mode === "link" ? "modeActive" : ""} type="button" onClick={() => setMode("link")} aria-pressed={mode === "link"}>
            <Youtube size={16} aria-hidden="true" />
            {t.youtubeUrl}
          </button>
        </div>
        <div className="youtubeStage">
          <div className="youtubeIconWrap">
            <Play size={22} aria-hidden="true" />
          </div>
          {mode === "link" ? <p>{t.youtubeStageHelp}</p> : null}
          {mode === "link" ? (
            <>
              <div className={isSubtitleDownloader ? "youtubeInputRow youtubeSubtitleRow" : "youtubeInputRow"}>
                <div className="youtubePasteField">
                  <span>{t.pasteLink}</span>
                  <input
                    type="url"
                    value={sourceUrl}
                    placeholder={placeholder}
                    aria-label={t.youtubeUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                  />
                </div>
                {isSubtitleDownloader ? (
                  <>
                    <label className="targetSelect youtubeSelect" aria-label={t.subtitleLanguage}>
                      <Languages size={16} aria-hidden="true" />
                      <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
                        <option value="EN">EN</option>
                        <option value="ZH">ZH</option>
                        <option value="JA">JA</option>
                        <option value="DE">DE</option>
                        <option value="FR">FR</option>
                      </select>
                    </label>
                    <label className="targetSelect youtubeSelect" aria-label={t.subtitleFormat}>
                      <select value={subtitleFormat} onChange={(event) => setSubtitleFormat(event.target.value)}>
                        {devoiceSubtitleFormats.map((format) => (
                          <option value={format.value} key={format.value}>{format.label}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
              </div>
              <button className="btn btnPrimary youtubeSubmitButton" type="button" disabled={disabled} onClick={() => void submitJob()}>
                <YoutubeSubmitIcon size={18} aria-hidden="true" />
                {isSubmitting ? t.submitting : sourceYoutubeHeroButtonLabel}
              </button>
              <small>{currentFormatHint}</small>
            </>
          ) : (
            <>
              <div className="youtubeFileDrop">
                <UploadCloud size={34} aria-hidden="true" />
              <div className="dropzoneTitle">{t.uploadTitle}</div>
                <p>{t.uploadHelp}</p>
                <small>{t.formats}</small>
                <label className="fileInput">
                  <FileUp size={18} aria-hidden="true" />
                  <span>{file ? file.name : t.chooseFile}</span>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              <button className="btn btnPrimary youtubeSubmitButton" type="button" disabled={disabled} onClick={() => void submitJob()}>
                  <Upload size={18} aria-hidden="true" />
                  {isSubmitting ? t.submitting : t.uploadFiles}
                </button>
              </div>
            </>
          )}
        </div>
        {message ? <p className="formMessage">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className={dedicatedTool ? "uploadPanel devoiceUploader" : "devoiceUploadShell"} aria-label={title}>
      {dedicatedTool ? null : (
        <div className="toolTabs" aria-label="AI tool">
          <button className={tool === "speech_to_text" || tool === "audio_to_text" || tool === "video_to_text" ? "toolActive" : ""} type="button" onClick={() => setTool(defaultJobType === "video_to_text" ? "video_to_text" : defaultJobType === "audio_to_text" ? "audio_to_text" : "speech_to_text")}>
            <AudioLines size={18} aria-hidden="true" />
            {t.speechToText}
          </button>
          <button className={tool === "remove_noise" ? "toolActive" : ""} type="button" onClick={() => setTool("remove_noise")}>
            <VolumeX size={18} aria-hidden="true" />
            {t.removeNoise}
          </button>
          <button className={tool === "text_to_speech" ? "toolActive" : ""} type="button" onClick={() => setTool("text_to_speech")}>
            <Speech size={18} aria-hidden="true" />
            {t.textToSpeech}
          </button>
        </div>
      )}

      <div className="uploadPanel devoiceUploader">
        <div className="uploadStage">
        {youtubeOnly ? null : (
          tool === "text_to_speech" ? null : (
            <div className="modeSwitch" aria-label={t.jobType}>
              <button className={mode === "file" ? "modeActive" : ""} type="button" onClick={() => setMode("file")}>
                <Headphones size={16} aria-hidden="true" />
                {t.videoAudio}
              </button>
              <button className={mode === "link" ? "modeActive" : ""} type="button" onClick={() => setMode("link")}>
                <Link2 size={16} aria-hidden="true" />
                {linkModeLabel}
              </button>
            </div>
          )
        )}

        <div className={mode === "link" && tool !== "text_to_speech" ? "dropzone linkDropzone" : "dropzone"}>
          {tool === "text_to_speech" || mode === "link" ? null : (
            <>
              <div className="uploadIcons">
                <VideoIcon />
                <AudioIcon />
              </div>
              <div className="dropzoneTitle">{mode === "file" ? title : t.youtubeTitle}</div>
              <p>{mode === "file" ? help : currentYoutubeHelp}</p>
              <small>{currentFormatHint}</small>
            </>
          )}

          <div className={tool === "text_to_speech" ? "inputRow ttsInputRow" : mode === "link" ? "inputRow linkInputRow" : "inputRow fileInputRow"}>
            {tool === "text_to_speech" ? (
              <textarea
                className="ttsInlineText"
                value={voiceText}
                maxLength={2000}
                placeholder={t.ttsPlaceholder}
                aria-label={t.ttsInputLabel}
                onChange={(event) => setVoiceText(event.target.value)}
              />
            ) : mode === "link" ? (
              <label className="pasteLinkField">
                <span>{t.pasteLink}</span>
                <input
                  type="url"
                  value={sourceUrl}
                  placeholder={placeholder}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitJob();
                    }
                  }}
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
              </label>
            ) : (
              <label className="fileInput">
                <Upload size={18} aria-hidden="true" />
                <span>{file ? file.name : t.uploadFiles}</span>
                <input
                  type="file"
                  accept={fileAccept}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    setFile(selectedFile);
                    if (selectedFile) {
                      void submitJob(selectedFile);
                    }
                  }}
                />
              </label>
            )}
            {tool === "text_to_speech" || isSubtitleDownloader ? (
            <label className="targetSelect" aria-label={tool === "text_to_speech" ? t.voiceLanguage : t.targetLanguage}>
              <Languages size={16} aria-hidden="true" />
              {tool === "text_to_speech" ? (
                <select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)}>
                  {devoiceVoiceLanguages.map((language) => (
                    <option value={language.code} key={language.code}>{language.label}</option>
                  ))}
                </select>
              ) : (
                <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
                  <option value="EN">EN</option>
                  <option value="ZH">ZH</option>
                  <option value="JA">JA</option>
                  <option value="DE">DE</option>
                  <option value="FR">FR</option>
                </select>
              )}
            </label>
            ) : null}
            {tool === "text_to_speech" ? (
              <label className="targetSelect" aria-label={t.voice}>
                <select value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
                  {devoiceVoices.map((voice) => (
                    <option value={voice.id} key={voice.id}>{voice.name} {voice.gender}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {isSubtitleDownloader ? (
              <label className="targetSelect" aria-label={t.subtitleFormat}>
                <select value={subtitleFormat} onChange={(event) => setSubtitleFormat(event.target.value)}>
                  {devoiceSubtitleFormats.map((format) => (
                    <option value={format.value} key={format.value}>{format.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {tool === "text_to_speech" ? (
            <button className="btn btnPrimary" type="button" disabled={disabled} onClick={() => void submitJob()}>
              {tool === "text_to_speech" ? <Volume2 size={18} aria-hidden="true" /> : mode === "link" ? <Link2 size={18} aria-hidden="true" /> : <FileUp size={18} aria-hidden="true" />}
              {isSubmitting ? t.submitting : tool === "text_to_speech" ? t.generate : mode === "file" ? buttonLabel : youtubeButtonLabel}
            </button>
            ) : null}
          </div>
          {tool === "text_to_speech" ? <small>{voiceText.length} / 2000</small> : null}
        </div>
        </div>
      </div>
      {message ? <p className="formMessage">{message}</p> : null}
    </div>
  );
}

function VideoIcon() {
  return (
    <span>
      <svg viewBox="0 0 24 24" role="img" aria-label="video">
        <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h5A2.5 2.5 0 0 1 15 7.5v9A2.5 2.5 0 0 1 12.5 19h-5A2.5 2.5 0 0 1 5 16.5v-9Z" />
        <path d="m15 10 4-2.4v8.8L15 14v-4Z" />
      </svg>
    </span>
  );
}

function AudioIcon() {
  return (
    <span>
      <svg viewBox="0 0 24 24" role="img" aria-label="audio">
        <path d="M7 9v6M11 6v12M15 9v6M19 11v2M3 11v2" />
      </svg>
    </span>
  );
}
