import { prisma } from "@/lib/prisma";
import { parseSubtitleTarget } from "@/lib/devoice-subtitle-settings";
import { fetchExternalYouTubeTranscriptResult, fetchYouTubeCaptionResult, hasExternalYouTubeTranscriptProvider, isYoutubeJobType } from "@/lib/devoice-youtube";
import { getVoiceLabel, getVoiceLanguageLabel } from "@/lib/devoice-voice-settings";
import { isDeVoiceJobType, type DeVoiceJobType } from "@/types/devoice-job";

export type DemoMediaJob = {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  storageKey: string | null;
  fileName: string | null;
  language: string | null;
  targetLanguage: string | null;
};

type MediaJob = NonNullable<Awaited<ReturnType<typeof prisma.mediaJob.findUnique>>>;

function jobTypeOf(sourceType: string): DeVoiceJobType {
  return isDeVoiceJobType(sourceType) ? sourceType : "speech_to_text";
}

function readableSource(job: DemoMediaJob) {
  return job.fileName ?? job.sourceUrl ?? job.storageKey ?? job.id;
}

function sourceText(job: DemoMediaJob) {
  if (!job.sourceUrl?.startsWith("data:text/plain,")) {
    return "";
  }

  try {
    return decodeURIComponent(job.sourceUrl.replace(/^data:text\/plain,?/i, "")).trim();
  } catch {
    return job.sourceUrl.replace(/^data:text\/plain,?/i, "").trim();
  }
}

function promptText(job: DemoMediaJob) {
  return sourceText(job) || job.fileName || job.sourceUrl || job.id;
}

function voiceSettings(job: DemoMediaJob) {
  return {
    language: getVoiceLanguageLabel(job.language),
    voice: getVoiceLabel(job.targetLanguage)
  };
}

function buildSrt(lines: string[]) {
  return lines
    .map((line, index) => {
      const start = String(index * 4).padStart(2, "0");
      const end = String(index * 4 + 4).padStart(2, "0");
      return `${index + 1}\n00:00:${start},000 --> 00:00:${end},000\n${line}`;
    })
    .join("\n\n");
}

export function buildDemoResult(job: DemoMediaJob) {
  const jobType = jobTypeOf(job.sourceType);
  const source = readableSource(job);

  if (jobType === "remove_noise") {
    const sourceName = readableSource(job);
    return {
      transcript: [
        `Clean audio preview prepared for ${sourceName}.`,
        "Noise profile: steady room tone and low-frequency hum reduced.",
        "Voice band: preserved with light normalization and preview rendering.",
        "Output: downloadable WAV preview plus cleanup record."
      ].join("\n"),
      summary: {
        summary: "Background noise was analyzed, gated and reduced. A clean WAV preview is available for playback and download.",
        chapters: [
          { title: "Noise profile detected", startSec: 0 },
          { title: "Speech band preserved", startSec: 8 },
          { title: "Clean preview rendered", startSec: 18 }
        ],
        keywords: ["noise removal", "audio cleanup", "WAV preview", "DeVoice"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo noise-removal engine"
    };
  }

  if (jobType === "voice_enhance") {
    const sourceName = readableSource(job);
    return {
      transcript: [
        `Enhanced voice preview prepared for ${sourceName}.`,
        "Voice isolation: speech-focused frequencies were separated from background ambience.",
        "Enhancement chain: clarity EQ, light normalization and export-ready preview rendering.",
        "Output: isolated voice audio available as MP3 or WAV plus processing record."
      ].join("\n"),
      summary: {
        summary: "The voice track was isolated and enhanced for clearer speech. MP3 and WAV downloads are available from the result page.",
        chapters: [
          { title: "Voice source received", startSec: 0 },
          { title: "Speech frequencies isolated", startSec: 8 },
          { title: "Enhanced voice export ready", startSec: 18 }
        ],
        keywords: ["voice enhancer", "voice isolation", "speech clarity", "MP3", "WAV"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo voice-enhancement engine"
    };
  }

  if (jobType === "voice_change") {
    const sourceName = readableSource(job);
    return {
      transcript: [
        `AI voice changer preview prepared for ${sourceName}.`,
        "Input voice: analyzed for speech presence, rhythm and vocal contour.",
        "Voice conversion chain: speech isolation, tonal reshaping and export-ready rendering.",
        "Output: changed voice audio available as MP3 or WAV plus processing record."
      ].join("\n"),
      summary: {
        summary: "The uploaded voice was processed through a voice-changing workflow and rendered as downloadable MP3/WAV preview audio.",
        chapters: [
          { title: "Voice source received", startSec: 0 },
          { title: "Speech profile analyzed", startSec: 8 },
          { title: "Changed voice export ready", startSec: 18 }
        ],
        keywords: ["voice changer", "AI voice", "speech conversion", "MP3", "WAV"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo voice-changer engine"
    };
  }

  if (jobType === "audio_extract") {
    const sourceName = readableSource(job);
    return {
      transcript: [
        `Audio track extracted from ${sourceName}.`,
        "Source video: analyzed for an embedded audio stream.",
        "Output: downloadable MP3 and WAV audio files.",
        "Result: ready for podcast editing, transcription, captions or reuse in content workflows."
      ].join("\n"),
      summary: {
        summary: "The video's audio track was extracted and prepared for playback and download as MP3 or WAV.",
        chapters: [
          { title: "Video source received", startSec: 0 },
          { title: "Audio stream detected", startSec: 6 },
          { title: "Extracted audio ready", startSec: 14 }
        ],
        keywords: ["audio extraction", "video to audio", "MP3", "WAV", "DeVoice"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo audio-extraction engine"
    };
  }

  if (jobType === "text_to_speech" || jobType === "ai_dubbing") {
    const settings = voiceSettings(job);
    const text = sourceText(job) || source;
    const isDubbing = jobType === "ai_dubbing";
    return {
      transcript: [
        isDubbing ? "AI dubbing generation completed." : "AI voice generation completed.",
        `Language: ${settings.language}.`,
        `Voice: ${settings.voice}.`,
        "",
        isDubbing ? "Dubbing script:" : "Input text:",
        text
      ].join("\n"),
      summary: {
        summary: isDubbing
          ? `AI dubbing was generated with ${settings.voice} in ${settings.language}. MP3 and WAV previews are available for video editing workflows.`
          : `AI voice generation completed with ${settings.voice} in ${settings.language}. A deterministic WAV preview was rendered for playback and download.`,
        chapters: [
          { title: isDubbing ? "Dubbing settings prepared" : "Voice settings prepared", startSec: 0 },
          { title: isDubbing ? "Script normalized" : "Text normalized", startSec: 4 },
          { title: isDubbing ? "Dubbing preview rendered" : "Speech preview rendered", startSec: 10 }
        ],
        keywords: [isDubbing ? "AI dubbing" : "text to speech", settings.voice, settings.language, "WAV preview"]
      },
      subtitles: "",
      translation: "",
      provider: isDubbing ? "DeVoice demo AI dubbing engine" : "DeVoice demo TTS engine"
    };
  }

  if (jobType === "voice_clone") {
    const settings = voiceSettings(job);
    const text = sourceText(job) || source;
    return {
      transcript: [
        "Voice cloning request completed.",
        `Language: ${settings.language}.`,
        `Target voice style: ${settings.voice}.`,
        `Sample: ${job.fileName ?? job.storageKey ?? "uploaded voice sample"}.`,
        "",
        "Input text:",
        text
      ].join("\n"),
      summary: {
        summary: `Voice cloning completed in demo mode for ${settings.voice}. The sample was analyzed and a cloned-voice WAV preview was rendered.`,
        chapters: [
          { title: "Voice sample analyzed", startSec: 0 },
          { title: "Clone profile prepared", startSec: 10 },
          { title: "Cloned preview rendered", startSec: 20 }
        ],
        keywords: ["voice cloning", settings.voice, settings.language, "WAV preview"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo voice-cloning engine"
    };
  }

  if (jobType === "ai_music" || jobType === "ai_rap") {
    const prompt = promptText(job);
    const isRap = jobType === "ai_rap";
    return {
      transcript: [
        `${isRap ? "AI rap" : "AI music"} generation completed.`,
        `Style: ${job.targetLanguage ?? "Default"}.`,
        "",
        "Prompt:",
        prompt,
        "",
        "Output:",
        isRap ? "A rap audio preview is ready for playback and MP3/WAV export." : "A music audio preview is ready for playback and MP3/WAV export."
      ].join("\n"),
      summary: {
        summary: `${isRap ? "AI rap" : "AI music"} preview generated from the prompt with ${job.targetLanguage ?? "default"} style.`,
        chapters: [
          { title: "Prompt received", startSec: 0 },
          { title: `${isRap ? "Rap" : "Music"} style prepared`, startSec: 4 },
          { title: "Audio preview rendered", startSec: 12 }
        ],
        keywords: [isRap ? "AI rap" : "AI music", job.targetLanguage ?? "style", "MP3", "WAV"]
      },
      subtitles: "",
      translation: "",
      provider: isRap ? "DeVoice demo AI rap engine" : "DeVoice demo AI music engine"
    };
  }

  if (jobType === "rap_lyrics") {
    const prompt = promptText(job);
    const style = job.targetLanguage ?? "Rap";
    const lyrics = [
      `[Style: ${style}]`,
      "",
      "Verse 1",
      `I start with the vision, turn the prompt into a scene,`,
      `Every line has motion, every bar cuts clean,`,
      `From the first rough idea to the rhythm in the room,`,
      `DeVoice drafts the lyrics and gives the hook room to bloom.`,
      "",
      "Hook",
      `Say it with the cadence, let the story ride,`,
      `Build it from the spark and put the beat inside,`,
      `Prompt to polished lyrics, ready to refine,`,
      `One more take, one more rhyme, one more line.`,
      "",
      "Verse 2",
      `Theme: ${prompt.slice(0, 180)}`,
      `Shape the mood, flip the flow, make the message land,`,
      `Keep the chorus memorable and the verses planned.`,
      "",
      "Bridge",
      "Break the pattern, breathe, then bring the hook back stronger."
    ].join("\n");
    return {
      transcript: lyrics,
      summary: {
        summary: `Structured rap lyrics generated in ${style} style from the supplied prompt.`,
        chapters: [
          { title: "Verse 1", startSec: 0 },
          { title: "Hook", startSec: 16 },
          { title: "Verse 2", startSec: 32 },
          { title: "Bridge", startSec: 48 }
        ],
        keywords: ["rap lyrics", style, "hook", "verses"]
      },
      subtitles: "",
      translation: "",
      provider: "DeVoice demo rap lyrics engine"
    };
  }

  const subtitleSettings = jobType === "youtube_subtitle" ? parseSubtitleTarget(job.targetLanguage) : null;
  const transcript =
    jobType === "youtube_summary"
      ? `Summary-ready transcript extracted from ${source}. This demo result shows the completed YouTube summarizer workflow with key points and timestamps.`
      : jobType === "youtube_subtitle"
        ? `Subtitle transcript extracted from ${source}. Language: ${subtitleSettings?.language ?? "EN"}. Format: ${subtitleSettings?.format ?? "SRT"}. This demo result includes downloadable captions.`
        : `Transcript generated from ${source}. This demo result keeps the DeVoice upload, processing, result review and export flow complete.`;

  return {
    transcript,
    summary: {
      summary:
        jobType === "youtube_summary"
          ? "The video was analyzed and condensed into a concise summary with chapters and keywords."
          : jobType === "youtube_subtitle"
            ? `The video subtitles were prepared in ${subtitleSettings?.language ?? "EN"} as ${subtitleSettings?.format ?? "SRT"} captions.`
          : "The media was transcribed and prepared for review, export, subtitles and translation.",
      chapters: [{ title: "Media received", startSec: 0 }, { title: "Transcript generated", startSec: 10 }, { title: "Results ready", startSec: 24 }],
      keywords: jobType.startsWith("youtube") ? ["YouTube", "transcript", "summary"] : ["transcription", "subtitles", "DeVoice"]
    },
    subtitles: buildSrt([transcript.slice(0, 90), "Export TXT, SRT or JSON from the result page."]),
    translation: job.targetLanguage ? `[${job.targetLanguage}] ${transcript}` : "",
    provider: "DeVoice demo transcription engine"
  };
}

export async function completeJobWithDemoResult(jobId: string) {
  const job = await prisma.mediaJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("Media job does not exist.");
  }

  if (isYoutubeJobType(job.sourceType) && job.sourceUrl) {
    try {
      const result = await fetchYouTubeCaptionResult({
        sourceUrl: job.sourceUrl,
        targetLanguage: job.targetLanguage,
        sourceType: job.sourceType
      });

      return prisma.mediaJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          provider: result.provider,
          fallbackTrail: [{ provider: result.provider, status: "success", mode: "youtube-captions" }],
          transcript: result.transcript,
          subtitles: result.subtitles,
          summary: JSON.stringify(result.summary),
          translation: result.translation,
          durationSec: result.durationSec
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown YouTube caption error.";
      console.warn("Unable to fetch live YouTube captions; falling back to DeVoice demo result.", error);
      if (hasExternalYouTubeTranscriptProvider()) {
        try {
          const result = await fetchExternalYouTubeTranscriptResult({
            sourceUrl: job.sourceUrl,
            targetLanguage: job.targetLanguage,
            sourceType: job.sourceType
          });

          return prisma.mediaJob.update({
            where: { id: job.id },
            data: {
              status: "completed",
              provider: result.provider,
              fallbackTrail: [
                { provider: "YouTube captions", status: "failed", error: message },
                { provider: result.provider, status: "success", mode: "external-youtube-transcript" }
              ],
              transcript: result.transcript,
              subtitles: result.subtitles,
              summary: JSON.stringify(result.summary),
              translation: result.translation,
              durationSec: result.durationSec
            }
          });
        } catch (providerError) {
          const providerMessage = providerError instanceof Error ? providerError.message : "Unknown external YouTube provider error.";
          console.warn("External YouTube transcript provider failed; falling back to DeVoice demo result.", providerError);
          const result = buildDemoResult(job);

          return prisma.mediaJob.update({
            where: { id: job.id },
            data: {
              status: "completed",
              provider: result.provider,
              fallbackTrail: [
                { provider: "YouTube captions", status: "failed", error: message },
                { provider: "External YouTube transcript provider", status: "failed", error: providerMessage },
                { provider: result.provider, status: "success", mode: "inline-demo" }
              ],
              transcript: result.transcript,
              subtitles: result.subtitles,
              summary: JSON.stringify(result.summary),
              translation: result.translation,
              durationSec: 30
            }
          });
        }
      }

      const result = buildDemoResult(job);

      return prisma.mediaJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          provider: result.provider,
          fallbackTrail: [
            { provider: "YouTube captions", status: "failed", error: message },
            { provider: result.provider, status: "success", mode: "inline-demo" }
          ],
          transcript: result.transcript,
          subtitles: result.subtitles,
          summary: JSON.stringify(result.summary),
          translation: result.translation,
          durationSec: 30
        }
      });
    }
  }

  const result = buildDemoResult(job);

  return prisma.mediaJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      provider: result.provider,
      fallbackTrail: [
        {
          provider: result.provider,
          status: "success",
          mode: "inline-demo",
          artifacts: ["result-record", ...(jobTypeOf(job.sourceType) === "remove_noise" || jobTypeOf(job.sourceType) === "voice_enhance" || jobTypeOf(job.sourceType) === "audio_extract" || jobTypeOf(job.sourceType) === "ai_dubbing" || jobTypeOf(job.sourceType) === "ai_music" || jobTypeOf(job.sourceType) === "ai_rap" || jobTypeOf(job.sourceType) === "text_to_speech" || jobTypeOf(job.sourceType) === "voice_clone" ? ["wav-preview"] : [])]
        }
      ],
      transcript: result.transcript,
      subtitles: result.subtitles,
      summary: JSON.stringify(result.summary),
      translation: result.translation,
      durationSec: 30
    }
  });
}
