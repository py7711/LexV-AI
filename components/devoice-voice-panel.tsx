"use client";

import { useMemo, useRef, useState } from "react";
import { Image as ImageIcon, PauseCircle, PlayCircle, Wand2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  sourceType?: Extract<DeVoiceJobType, "text_to_speech" | "voice_clone" | "ai_dubbing">;
}) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const t = getDictionary(locale).tool;
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [customVoiceFile, setCustomVoiceFile] = useState<File | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<string>(devoiceVoiceLanguages[0].code);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(devoiceVoices[0].id);
  const [playingVoiceId, setPlayingVoiceId] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedVoice = devoiceVoices.find((voice) => voice.id === selectedVoiceId) ?? devoiceVoices[0];
  const buttonLabel = useMemo(() => {
    if (status) return status;
    return kind === "speech" ? t.generate : cta;
  }, [cta, kind, status, t.generate]);

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

  async function generate() {
    const currentText = textareaRef.current?.value ?? text;
    setText(currentText);
    if (!currentText.trim()) {
      setStatus(t.enterTextStatus);
      return;
    }
    if (kind === "clone" && !sampleFile) {
      setStatus(t.uploadVoiceSample);
      return;
    }
    if (sessionStatus !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      setStatus(t.signInRequired);
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

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: sourceType ?? (kind === "speech" ? "text_to_speech" : "voice_clone"),
          sourceUrl: `data:text/plain,${encodeURIComponent(currentText)}`,
          storageKey: sampleUpload?.storageKey,
          fileName: kind === "clone" && sampleFile ? sampleFile.name : customVoiceFile ? customVoiceFile.name : "text-to-speech.txt",
          language: voiceLanguage,
          targetLanguage: customVoiceFile ? "custom" : selectedVoice.id
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
    <div className="voicePanel">
      <div className="voiceInput">
        <textarea
          ref={textareaRef}
          placeholder={t.ttsPlaceholder}
          aria-label={t.ttsInputLabel}
          maxLength={2000}
          onChange={(event) => {
            setText(event.target.value);
            if (status) setStatus("");
          }}
        />
        <div className="voiceCounter">{text.length} / 2000</div>
      </div>
      <div className="voiceSettings">
        <div className="voiceSelectGrid">
          <label>
            <span>{t.languageLabel}</span>
            <select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)}>
              {devoiceVoiceLanguages.map((language) => (
                <option value={language.code} key={language.code}>{language.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.voiceLabel}</span>
            <select value={selectedVoiceId} onChange={(event) => setSelectedVoiceId(event.target.value)}>
              {devoiceVoices.map((voice) => (
                <option value={voice.id} key={voice.id}>{voice.name} {voice.gender}</option>
              ))}
            </select>
          </label>
        </div>
        {kind === "clone" ? (
          <label className={sampleFile ? "customVoiceBadge customVoiceSelected" : "customVoiceBadge"}>
            <strong>{t.newLabel}</strong>
            <span>{sampleFile ? sampleFile.name : t.customVoice}</span>
            <em>{t.uploadMp3File}</em>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSampleFile(nextFile);
                if (nextFile && status === t.uploadVoiceSample) setStatus("");
              }}
            />
          </label>
        ) : null}
        {kind === "speech" ? (
          <label className={customVoiceFile ? "customVoiceBadge customVoiceSelected" : "customVoiceBadge"}>
            <strong>{t.newLabel}</strong>
            <span>{customVoiceFile ? customVoiceFile.name : t.customVoice}</span>
            <em>{t.uploadMp3File}</em>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setCustomVoiceFile(nextFile);
                if (nextFile) setSelectedVoiceId(devoiceVoices[0].id);
              }}
            />
          </label>
        ) : null}
        <div className="voiceList" aria-label={t.voiceExamples}>
          {devoiceVoices.map((voice) => (
            <button className={selectedVoiceId === voice.id ? "voiceSelected" : ""} type="button" key={voice.id} onClick={() => previewVoice(voice)}>
              <i aria-hidden="true">
                <ImageIcon size={18} />
              </i>
              <span>
                <strong>{voice.name}</strong>
                <small>{voice.gender}</small>
              </span>
              <em>{playingVoiceId === voice.id ? t.playing : t.example}</em>
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
          <Wand2 size={18} aria-hidden="true" />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
