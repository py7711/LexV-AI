"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isUpgradeRequired, notifyUpgradeRequired } from "@/lib/client-errors";
import { getDictionary, localizedPath, type Locale } from "@/lib/i18n";
import type { DeVoiceJobType } from "@/types/devoice-job";

type UploadResponse = {
  upload: {
    mode?: "r2" | "local";
    storageKey: string;
    uploadUrl: string | null;
    publicUrl?: string;
  };
};

type JobResponse = {
  job: { id: string };
};

const acceptedFormats = ".mp3,.wav,.flac,.aac,.ogg,.aiff,.avi,.mp4,.mkv,audio/*,video/*";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function NoiseUploadClient({
  cta: _cta,
  locale,
  sourceType = "remove_noise",
  mode = "noise"
}: {
  cta: string;
  locale: Locale;
  sourceType?: Extract<DeVoiceJobType, "remove_noise" | "voice_enhance" | "voice_change">;
  mode?: "noise" | "voice-enhance" | "voice-change";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { status } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = getDictionary(locale).tool;
  const isVoiceEnhance = mode === "voice-enhance";
  const isVoiceChange = mode === "voice-change";
  const progressSteps = isVoiceEnhance ? t.voiceEnhanceSteps : t.noiseSteps;
  const progressCopy = isVoiceEnhance ? t.voiceEnhanceProgress : t.noiseProgress;
  const progressLabel = isVoiceEnhance ? t.voiceEnhanceProgressLabel : t.noiseProgressLabel;

  async function createNoiseJob(file: File) {
    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/octet-stream"
      })
    });

    if (!uploadResponse.ok) {
      const data = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? t.prepareUploadError);
    }

    const { upload } = (await uploadResponse.json()) as UploadResponse;
    setActiveStep(1);
    setProgress(38);

    if (upload.mode !== "local") {
      if (!upload.uploadUrl) {
        throw new Error(t.prepareUploadError);
      }

      const putResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });

      if (!putResponse.ok) {
        throw new Error(`${t.uploadFailed}: HTTP ${putResponse.status}`);
      }
    }

    setProgress(64);
    setActiveStep(2);
    setProgress(78);
    const jobResponse = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        storageKey: upload.storageKey,
        sourceUrl: upload.mode === "local" ? undefined : upload.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
        language: locale
      })
    });

    if (!jobResponse.ok) {
      const data = (await jobResponse.json().catch(() => null)) as { error?: string } | null;
      if (isUpgradeRequired(jobResponse.status, data?.error)) {
        notifyUpgradeRequired();
      }
      throw new Error(data?.error ?? (isVoiceEnhance ? t.voiceEnhanceError : isVoiceChange ? t.voiceChangeError : t.removeNoiseError));
    }

    setProgress(100);
    return (await jobResponse.json()) as JobResponse;
  }

  async function submitFile(file: File) {
    if (status !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      setSelectedFile(file);
      setMessage(isVoiceEnhance ? t.voiceEnhanceSignInRequired : isVoiceChange ? t.voiceChangeSignInRequired : t.noiseSignInRequired);
      return;
    }

    setSelectedFile(file);
    setIsSubmitting(true);
    setMessage("");
    setActiveStep(0);
    setProgress(12);

    try {
      const data = await createNoiseJob(file);
      setActiveStep(3);
      setProgress(100);
      window.dispatchEvent(new Event("devoice:credits-changed"));
      await wait(320);
      router.push(localizedPath(locale, `jobs/${data.job.id}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isVoiceEnhance ? t.voiceEnhanceError : isVoiceChange ? t.voiceChangeError : t.removeNoiseError);
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void submitFile(file);
  }

  function openHistory() {
    if (status !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      return;
    }

    router.push(localizedPath(locale, "my-resources"));
  }

  return (
    <div className="noiseFrame">
      <div className="noiseTopRow">
        <button className="noiseHistoryButton" type="button" onClick={openHistory}>
          {t.history}
        </button>
      </div>
      <div className="noiseSteps" aria-label={progressLabel}>
        {progressSteps.map((label, index) => (
          <span className={index <= activeStep ? "noiseStepActive" : ""} key={label}>
            <strong>{index < activeStep ? <Check size={15} aria-hidden="true" /> : index + 1}</strong>
            {label}
          </span>
        ))}
      </div>
      {isSubmitting && selectedFile ? (
        <div className="noiseProgressCard" key={activeStep}>
          <div className="noiseProgressMeta">
            <div>
              <strong>{progressCopy[activeStep][0]}</strong>
              <span>{progressCopy[activeStep][1]}</span>
            </div>
            <b>{Math.round(progress)}%</b>
          </div>
          <div
            className="as-progress-shell noiseProgressShell"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <span className="as-progress-bar noiseProgressBar" style={{ width: `${progress}%` }} />
          </div>
          <div className="noiseProgressFile">
            <span>{selectedFile.name}</span>
            <small>{formatFileSize(selectedFile.size)}</small>
          </div>
        </div>
      ) : null}
      <label
        className={[
          dragging ? "noiseDrop noiseDropActive" : "noiseDrop",
          isSubmitting ? "noiseDropBusy" : ""
        ].filter(Boolean).join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFormats}
          disabled={isSubmitting}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <FileUp size={34} aria-hidden="true" />
        <strong>{isVoiceEnhance || isVoiceChange ? t.dropVoiceAudio : t.dropAudioVideo}</strong>
        <span>{isVoiceEnhance ? t.dropVoiceHelp : isVoiceChange ? t.dropVoiceChangeHelp : t.dropHelp}</span>
        <em>{isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : null}{isSubmitting ? t.processing : t.chooseFileShort}</em>
        {selectedFile ? <small>{selectedFile.name}</small> : null}
      </label>
      <p>{isVoiceEnhance || isVoiceChange ? t.voiceEnhanceAcceptedFormats : t.acceptedFormats}</p>
      {message ? <p className="formMessage">{message}</p> : null}
    </div>
  );
}
