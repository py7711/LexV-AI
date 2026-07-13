"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Headphones, PauseCircle, PlayCircle, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import { isUpgradeRequired, notifyUpgradeRequired } from "@/lib/client-errors";
import { devoiceVoiceLanguages, devoiceVoices, type DeVoiceVoice } from "@/lib/devoice-voice-settings";
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

const voiceAvatarExamples = [
  { id: "trump", alt: "trump voice", src: "/assets/voice-avatars/telangmu.png", voiceId: "ryan" },
  { id: "andi", alt: "andi voice", src: "/assets/voice-avatars/andi.png", voiceId: "sonia" },
  { id: "joker", alt: "joker voice", src: "/assets/voice-avatars/joker.png", voiceId: "elliot" },
  { id: "jiesen", alt: "jiesen voice", src: "/assets/voice-avatars/jiesen.png", voiceId: "oliver" },
  { id: "meiluyt", alt: "meiluyt voice", src: "/assets/voice-avatars/md.png", voiceId: "libby" },
  { id: "roger", alt: "roger voice", src: "/assets/voice-avatars/sishi.png", voiceId: "thomas" }
] as const;

export function DeVoiceVoicePanel({
  kind,
  cta,
  locale = "en",
  sourceType
}: {
  kind: "speech" | "clone";
  cta: string;
  locale?: Locale;
  sourceType?: Extract<DeVoiceJobType, "text_to_speech" | "voice_clone" | "ai_dubbing" | "voice_change">;
}) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const t = getDictionary(locale).tool;
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [toastRoot, setToastRoot] = useState<HTMLElement | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [customVoiceFile, setCustomVoiceFile] = useState<File | null>(null);
  const [voicePickerMode, setVoicePickerMode] = useState<"custom" | "preset">("custom");
  const [voiceLanguage, setVoiceLanguage] = useState<string>("en-GB");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(devoiceVoices[0].id);
  const [playingVoiceId, setPlayingVoiceId] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"language" | "voice" | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sampleFileInputRef = useRef<HTMLInputElement | null>(null);
  const customVoiceInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedVoice = devoiceVoices.find((voice) => voice.id === selectedVoiceId) ?? devoiceVoices[0];
  const selectedLanguage = devoiceVoiceLanguages.find((language) => language.code === voiceLanguage) ?? devoiceVoiceLanguages[0];
  const buttonLabel = useMemo(() => {
    if (status) return status;
    return t.generate;
  }, [status, t.generate]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    setToastRoot(document.body);
  }, []);

  useEffect(() => {
    if (!validationMessage) return;
    const timeoutId = window.setTimeout(() => setValidationMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [validationMessage]);

  function showValidationMessage(message: string) {
    setValidationMessage(message);
  }

  function previewVoice(voice: DeVoiceVoice = selectedVoice, options?: { keepAvatarSelection?: boolean }) {
    const AudioContextConstructor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      setStatus(t.previewUnsupported);
      return;
    }

    const audioContext = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = audioContext;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = voice.gender === "Man" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(voice.frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(voice.frequency * 1.18, audioContext.currentTime + 0.38);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.85);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.9);
    setSelectedVoiceId(voice.id);
    if (!options?.keepAvatarSelection) setSelectedAvatarId("");
    setPlayingVoiceId(voice.id);
    setVoicePickerMode("preset");
    setStatus(`${voice.name} preview`);
    window.setTimeout(() => {
      setPlayingVoiceId((current) => (current === voice.id ? "" : current));
      setStatus((current) => (current === `${voice.name} preview` ? "" : current));
    }, 950);
  }

  function previewAvatarVoice(example: (typeof voiceAvatarExamples)[number]) {
    const voice = devoiceVoices.find((item) => item.id === example.voiceId) ?? selectedVoice;
    setSelectedAvatarId(example.id);
    previewVoice(voice, { keepAvatarSelection: true });
    window.setTimeout(() => {
      setSelectedAvatarId((current) => (current === example.id ? "" : current));
    }, 950);
  }

  function chooseVoice(voice: DeVoiceVoice) {
    setSelectedVoiceId(voice.id);
    setSampleFile(null);
    setCustomVoiceFile(null);
    setVoicePickerMode("preset");
    setOpenDropdown(null);
  }

  function chooseCustomVoice() {
    setVoicePickerMode("custom");
    if (kind === "clone") {
      sampleFileInputRef.current?.click();
      return;
    }
    customVoiceInputRef.current?.click();
  }

  async function generate() {
    const currentText = textareaRef.current?.value ?? text;
    setText(currentText);
    if (kind === "clone" && voicePickerMode === "custom" && !sampleFile) {
      showValidationMessage(t.customVoiceRequired);
      return;
    }
    if (!currentText.trim()) {
      showValidationMessage(t.enterTextStatus);
      return;
    }
    if (sessionStatus !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      showValidationMessage(t.signInRequired);
      return;
    }

    setStatus(t.generating);
    try {
      let sampleUpload: UploadResponse["upload"] | null = null;

      const uploadFile = kind === "clone" ? sampleFile : customVoiceFile;
      if (uploadFile) {
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: uploadFile.name,
            contentType: uploadFile.type || "application/octet-stream"
          })
        });

        if (!uploadResponse.ok) {
          const data = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? t.customVoiceUploadError);
        }

        sampleUpload = ((await uploadResponse.json()) as UploadResponse).upload;
        if (sampleUpload.mode !== "local") {
          if (!sampleUpload.uploadUrl) {
            throw new Error(t.voiceSampleUploadError);
          }

          const putResponse = await fetch(sampleUpload.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": uploadFile.type || "application/octet-stream"
            },
            body: uploadFile
          });

          if (!putResponse.ok) {
            throw new Error(`${t.uploadFailed}: HTTP ${putResponse.status}`);
          }
        }
      }

      const selectedTargetVoice =
        (kind === "clone" && sampleFile) || (kind === "speech" && voicePickerMode === "custom" && customVoiceFile)
          ? "custom"
          : selectedVoice.id;

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: sourceType ?? (kind === "speech" ? "text_to_speech" : "voice_clone"),
          sourceUrl: `data:text/plain,${encodeURIComponent(currentText)}`,
          storageKey: sampleUpload?.storageKey,
          fileName: kind === "clone" && sampleFile ? sampleFile.name : customVoiceFile ? customVoiceFile.name : "text-to-speech.txt",
          language: voiceLanguage,
          targetLanguage: selectedTargetVoice
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (isUpgradeRequired(response.status, data?.error)) {
          notifyUpgradeRequired();
        }
        throw new Error(data?.error ?? t.createVoiceJobError);
      }

      const data = (await response.json()) as { job: { id: string } };
      setStatus(kind === "speech" ? t.previewReady : t.voiceReady);
      window.dispatchEvent(new Event("devoice:credits-changed"));
      router.push(localizedPath(locale, `jobs/${data.job.id}`));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.unableGenerate);
    }
  }

  return (
    <div className="voicePanel" ref={panelRef}>
      <div className="voiceInput">
        <textarea
          ref={textareaRef}
          placeholder={t.ttsPlaceholder}
          aria-label={t.ttsInputLabel}
          maxLength={2000}
          onChange={(event) => {
            setText(event.target.value);
            if (status) setStatus("");
            if (validationMessage) setValidationMessage("");
          }}
        />
        <div className="voiceCounter">{text.length} / 2000</div>
      </div>
      <div className="voiceSettings">
        <div className="voicePanelMeta">
          <span>{text.length} / 2000</span>
          {kind === "clone" ? <span>{sampleFile ? sampleFile.name : t.uploadVoiceSample}</span> : <span>{customVoiceFile ? customVoiceFile.name : t.customVoice}</span>}
        </div>
        <div className="voiceSelectGrid">
          <div className="voiceComboboxField">
            <span>{t.languageLabel}</span>
            <button
              className="voiceComboboxTrigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={openDropdown === "language"}
              onClick={() => setOpenDropdown((current) => (current === "language" ? null : "language"))}
            >
              <span>{selectedLanguage.label}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {openDropdown === "language" ? (
              <div className="voiceComboboxMenu languageComboboxMenu" role="listbox" aria-label={t.languageLabel}>
                {devoiceVoiceLanguages.map((language) => (
                  <button
                    className={voiceLanguage === language.code ? "voiceComboboxOption voiceComboboxOptionActive" : "voiceComboboxOption"}
                    type="button"
                    role="option"
                    aria-selected={voiceLanguage === language.code}
                    key={language.code}
                    onClick={() => {
                      setVoiceLanguage(language.code);
                      setOpenDropdown(null);
                    }}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="voiceComboboxField">
            <span>{t.voiceLabel}</span>
            <div className="voicePickerMenu voicePickerMenuInline" role="listbox" aria-label={t.voiceLabel}>
              <button
                className={voicePickerMode === "custom" ? "voicePickerOption voicePickerOptionActive" : "voicePickerOption"}
                type="button"
                role="option"
                aria-selected={voicePickerMode === "custom"}
                onClick={chooseCustomVoice}
              >
                <span className="voiceCustomLabel">
                  <strong>{kind === "clone" && sampleFile ? sampleFile.name : kind === "speech" && customVoiceFile ? customVoiceFile.name : t.customVoice}</strong>
                </span>
                <span className="voiceCustomUploadHint">
                  <UploadCloud size={14} aria-hidden="true" />
                  <small>{t.uploadMp3File}</small>
                </span>
                <em className="voiceNewBadge">{t.newLabel}</em>
              </button>
              {devoiceVoices.map((voice) => (
                <button
                  className={voicePickerMode === "preset" && selectedVoiceId === voice.id ? "voicePickerOption voicePickerOptionActive" : "voicePickerOption"}
                  type="button"
                  role="option"
                  aria-selected={voicePickerMode === "preset" && selectedVoiceId === voice.id}
                  key={voice.id}
                  onClick={() => chooseVoice(voice)}
                >
                  <span className="voicePresetLabel">
                    <strong>{voice.name}</strong>
                    <small>{voice.gender}</small>
                  </span>
                  <em onClick={(event) => {
                    event.stopPropagation();
                    previewVoice(voice);
                  }}>
                    <Headphones size={14} aria-hidden="true" />
                    {playingVoiceId === voice.id ? t.playing : t.example}
                  </em>
                </button>
              ))}
            </div>
          </div>
        </div>
        {kind === "clone" ? (
          <label className={sampleFile ? "customVoiceBadge customVoiceSelected" : "customVoiceBadge"}>
            <strong>{t.newLabel}</strong>
            <UploadCloud size={16} aria-hidden="true" />
            <span>{sampleFile ? sampleFile.name : t.customVoice}</span>
            <em>{t.uploadMp3File}</em>
            <input
              ref={sampleFileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSampleFile(nextFile);
                if (nextFile) setVoicePickerMode("custom");
                if (nextFile && validationMessage) setValidationMessage("");
              }}
            />
          </label>
        ) : null}
        {kind === "speech" ? (
          <label className={customVoiceFile ? "customVoiceBadge customVoiceSelected" : "customVoiceBadge"}>
            <strong>{t.newLabel}</strong>
            <UploadCloud size={16} aria-hidden="true" />
            <span>{customVoiceFile ? customVoiceFile.name : t.customVoice}</span>
            <em>{t.uploadMp3File}</em>
            <input
              ref={customVoiceInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setCustomVoiceFile(nextFile);
                if (nextFile) {
                  setSelectedVoiceId(devoiceVoices[0].id);
                  setVoicePickerMode("custom");
                  if (validationMessage) setValidationMessage("");
                }
              }}
            />
          </label>
        ) : null}
        <div className="voiceList" aria-label={t.voiceExamples}>
          {devoiceVoices.map((voice) => (
            <button className={selectedVoiceId === voice.id ? "voiceSelected" : ""} type="button" key={voice.id} onClick={() => previewVoice(voice)}>
              <span>
                <strong>{voice.name}</strong>
                <small>{voice.gender}</small>
              </span>
              <em>
                <Headphones size={14} aria-hidden="true" />
                {playingVoiceId === voice.id ? t.playing : t.example}
              </em>
            </button>
          ))}
        </div>
        <div className="voiceAvatarStrip" aria-label={t.featuredVoiceExamples}>
          {voiceAvatarExamples.map((example) => (
            <button
              className={selectedAvatarId === example.id ? "voiceAvatarSelected" : ""}
              type="button"
              key={example.id}
              onClick={() => previewAvatarVoice(example)}
            >
              <Image src={example.src} alt={example.alt} width={48} height={48} />
            </button>
          ))}
        </div>
        <div className="voicePreview">
          <button type="button" aria-label={t.previewVoice} onClick={() => previewVoice()}>
            <PlayCircle size={20} aria-hidden="true" />
          </button>
          <span />
          <PauseCircle className={playingVoiceId ? "voicePreviewActive" : ""} size={18} aria-hidden="true" />
        </div>
        <button className="btn btnPrimary" type="button" onClick={generate}>
          {buttonLabel}
        </button>
      </div>
      {validationMessage && toastRoot
        ? createPortal(
            <div className="voiceValidationToast" role="alert" aria-live="polite">
              {validationMessage}
            </div>,
            toastRoot
          )
        : null}
    </div>
  );
}
