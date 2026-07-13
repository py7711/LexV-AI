import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outputPath = process.argv[2] ?? "docs/research/devoice.io/function-entry-coverage-audit-20260701.json";

const files = {
  toolPage: "components/devoice-tool-page.tsx",
  voicePanel: "components/devoice-voice-panel.tsx",
  webJobsApi: "app/api/jobs/route.ts",
  developerJobsApi: "app/api/v1/jobs/route.ts",
  uploadsApi: "app/api/uploads/route.ts",
  voiceProcessing: "lib/devoice-voice-processing.ts",
  voiceSettings: "lib/devoice-voice-settings.ts",
  demoProcessing: "lib/devoice-demo-processing.ts",
  jobTypes: "types/devoice-job.ts",
  ttsDemo: "components/text-to-speech-api-demo.tsx",
  jobForm: "components/job-form.tsx",
  noiseUpload: "components/noise-upload-client.tsx",
  promptPanel: "components/devoice-prompt-panel.tsx",
  jobResult: "components/devoice-job-result.tsx",
  pricing: "components/devoice-pricing-client.tsx",
  shell: "components/devoice-shell.tsx"
};

const flows = [
  {
    targetPath: "text-to-speech",
    priority: "required",
    expectedKind: "speech",
    panelMode: "speech",
    expectedSourceType: "text_to_speech",
    uploadPolicy: "preset voice can create a job directly; custom voice selection uploads a sample first"
  },
  {
    targetPath: "ai-voice-cloning",
    priority: "required",
    expectedKind: "clone",
    panelMode: "clone",
    expectedSourceType: "voice_clone",
    uploadPolicy: "voice sample is required before creating a clone job"
  },
  {
    targetPath: "ai-voice-generator",
    priority: "tts-alias",
    expectedKind: "speech",
    panelMode: "speech",
    expectedSourceType: "text_to_speech",
    uploadPolicy: "same Text to Speech backend entry"
  },
  {
    targetPath: "ai-voice-actors",
    priority: "tts-alias",
    expectedKind: "speech",
    panelMode: "speech",
    expectedSourceType: "text_to_speech",
    uploadPolicy: "same Text to Speech backend entry"
  },
  {
    targetPath: "ai-dubbing",
    priority: "related-voice-entry",
    expectedKind: "dubbing",
    panelMode: "speech",
    expectedSourceType: "ai_dubbing",
    uploadPolicy: "voice panel creates a deferred dubbing job"
  }
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const source = Object.fromEntries(Object.entries(files).map(([key, relativePath]) => [key, read(relativePath)]));

function includesAll(text, snippets) {
  return snippets.every((snippet) => text.includes(snippet));
}

function regexTest(text, pattern) {
  return pattern.test(text);
}

function stringValuesForProperty(text, propertyName) {
  return [...text.matchAll(new RegExp(`${propertyName}: "([^"]+)"`, "g"))].map((match) => match[1]);
}

function maxLengthItem(values) {
  return values.reduce((longest, value) => (value.length > longest.length ? value : longest), "");
}

function schemaMaxFor(fieldName, text) {
  const match = text.match(new RegExp(`${fieldName}: z\\.string\\(\\)\\.min\\(2\\)\\.max\\((\\d+)\\)\\.optional\\(\\)`));
  return match ? Number(match[1]) : null;
}

function slugConfigHasKind(slug, kind) {
  return regexTest(
    source.toolPage,
    new RegExp(`["']${slug}["']\\s*:\\s*{[\\s\\S]*?slug:\\s*["']${slug}["'][\\s\\S]*?kind:\\s*["']${kind}["']`)
  );
}

function defaultJobTypeMaps(slug, sourceType) {
  if (sourceType === "text_to_speech") {
    return regexTest(
      source.toolPage,
      /slug === "text-to-speech" \|\| slug === "ai-voice-generator" \|\| slug === "ai-voice-actors"\) return "text_to_speech"/
    );
  }
  return source.toolPage.includes(`slug === "${slug}") return "${sourceType}"`);
}

function webRouteDefers(sourceType, text) {
  return includesAll(text, [
    `input.sourceType === "${sourceType}"`,
    `return sourceType === "text_to_speech" || sourceType === "voice_clone" || sourceType === "ai_dubbing";`,
    "isDeferredVoiceEntry(job.sourceType)",
    "await completeJobWithDemoResult(job.id)"
  ]);
}

function providerHooksFor(sourceType) {
  if (sourceType === "text_to_speech" || sourceType === "ai_dubbing") {
    return includesAll(source.voiceProcessing, [
      `sourceType === "${sourceType}"`,
      "hasOpenAiSpeechProvider()",
      "buildOpenAiSpeechAudio",
      "completeWithDemoFallback"
    ]);
  }

  if (sourceType === "voice_clone") {
    return includesAll(source.voiceProcessing, [
      `sourceType === "voice_clone"`,
      "hasAssemblyAiVoiceCloneProvider()",
      "buildAssemblyAiClonedSpeech",
      "hasOpenAiSpeechProvider()",
      "completeWithDemoFallback"
    ]);
  }

  return false;
}

const voiceLanguageCodes = stringValuesForProperty(source.voiceSettings, "code");
const voiceIds = stringValuesForProperty(source.voiceSettings, "id");
const longestVoiceLanguageCode = maxLengthItem(voiceLanguageCodes);
const longestVoiceId = maxLengthItem(voiceIds);
const webLanguageMax = schemaMaxFor("language", source.webJobsApi);
const webTargetLanguageMax = schemaMaxFor("targetLanguage", source.webJobsApi);
const developerLanguageMax = schemaMaxFor("language", source.developerJobsApi);
const developerTargetLanguageMax = schemaMaxFor("targetLanguage", source.developerJobsApi);

const sharedChecks = {
  voicePanelMountedForVoiceKinds: includesAll(source.toolPage, [
    "<DeVoiceVoicePanel",
    `kind={config.kind === "clone" ? "clone" : "speech"}`,
    `sourceType={config.kind === "dubbing" ? "ai_dubbing" : config.kind === "voice-change" ? "voice_change" : undefined}`
  ]),
  voicePanelPostsUploadEntry: source.voicePanel.includes('fetch("/api/uploads"'),
  voicePanelPostsJobEntry: source.voicePanel.includes('fetch("/api/jobs"'),
  voicePanelDefaultSourceTypes: includesAll(source.voicePanel, [
    `sourceType: sourceType ?? (kind === "speech" ? "text_to_speech" : "voice_clone")`,
    `storageKey: sampleUpload?.storageKey`,
    `sourceUrl: \`data:text/plain,\${encodeURIComponent(currentText)}\``
  ]),
  voicePanelPayloadContract: includesAll(source.voicePanel, [
    `sourceType: sourceType ?? (kind === "speech" ? "text_to_speech" : "voice_clone")`,
    `sourceUrl: \`data:text/plain,\${encodeURIComponent(currentText)}\``,
    `storageKey: sampleUpload?.storageKey`,
    `fileName: kind === "clone" && sampleFile ? sampleFile.name : customVoiceFile ? customVoiceFile.name : "text-to-speech.txt"`,
    "language: voiceLanguage",
    "targetLanguage: selectedTargetVoice"
  ]),
  voicePanelMarksUploadedSamplesAsCustomTarget: includesAll(source.voicePanel, [
    "const selectedTargetVoice =",
    `(kind === "clone" && sampleFile) || (kind === "speech" && voicePickerMode === "custom" && customVoiceFile)`,
    `? "custom"`,
    ": selectedVoice.id",
    "targetLanguage: selectedTargetVoice"
  ]),
  webJobsAcceptsTextPayload: source.webJobsApi.includes("sourceUrl: z.string().min(3).max(4000).optional()"),
  developerJobsAcceptsTextPayload: source.developerJobsApi.includes("sourceUrl: z.string().min(3).max(4000).optional()"),
  webJobsAcceptsLongVoiceLanguageCodes: includesAll(source.webJobsApi, [
    "language: z.string().min(2).max(80).optional()",
    "targetLanguage: z.string().min(2).max(80).optional()"
  ]),
  developerJobsAcceptsLongVoiceLanguageCodes: includesAll(source.developerJobsApi, [
    "language: z.string().min(2).max(80).optional()",
    "targetLanguage: z.string().min(2).max(80).optional()"
  ]),
  webJobsLanguageSchemaCoversVoiceSettings:
    webLanguageMax !== null &&
    webTargetLanguageMax !== null &&
    longestVoiceLanguageCode.length <= webLanguageMax &&
    Math.max(longestVoiceId.length, "custom".length) <= webTargetLanguageMax,
  developerJobsLanguageSchemaCoversVoiceSettings:
    developerLanguageMax !== null &&
    developerTargetLanguageMax !== null &&
    longestVoiceLanguageCode.length <= developerLanguageMax &&
    Math.max(longestVoiceId.length, "custom".length) <= developerTargetLanguageMax,
  webJobsPersistsVoicePayload: includesAll(source.webJobsApi, [
    "sourceUrl: parsed.data.sourceUrl",
    "storageKey: parsed.data.storageKey",
    "fileName: parsed.data.fileName",
    "language: parsed.data.language",
    "targetLanguage: parsed.data.targetLanguage"
  ]),
  developerJobsPersistsVoicePayload: includesAll(source.developerJobsApi, [
    "sourceUrl: parsed.data.sourceUrl",
    "storageKey: parsed.data.storageKey",
    "fileName: parsed.data.fileName",
    "language: parsed.data.language",
    "targetLanguage: parsed.data.targetLanguage"
  ]),
  targetDefaultCustomVoiceState: source.voicePanel.includes(`useState<"custom" | "preset">("custom")`),
  speechCustomDefaultCanSubmitWithoutUpload: includesAll(source.voicePanel, [
    `if (kind === "clone" && voicePickerMode === "custom" && !sampleFile)`,
    `(kind === "clone" && sampleFile) || (kind === "speech" && voicePickerMode === "custom" && customVoiceFile)`,
    ": selectedVoice.id"
  ]),
  cloneRequiresSampleBeforeSubmit: includesAll(source.voicePanel, [
    `kind === "clone" && voicePickerMode === "custom" && !sampleFile`,
    "showValidationMessage(t.customVoiceRequired)"
  ]),
  uploadsApiExists: includesAll(source.uploadsApi, ["export async function POST", "storageKey", "uploadUrl"]),
  demoCompletionExists: includesAll(source.demoProcessing, ["export async function completeJobWithDemoResult", "buildDemoResult"]),
  ttsInternalDemoPostsAndPolls: includesAll(source.ttsDemo, [
    'fetch("/api/jobs"',
    `sourceType: "text_to_speech"`,
    "pollResponse",
    "`/api/jobs/${createData.job.id}`"
  ]),
  jobFormPostsJobEntry: source.jobForm.includes('fetch("/api/jobs"'),
  jobFormPostsUploadEntry: source.jobForm.includes('fetch("/api/uploads"'),
  noiseUploadPostsUploadEntry: source.noiseUpload.includes('fetch("/api/uploads"'),
  noiseUploadPostsJobEntry: source.noiseUpload.includes('fetch("/api/jobs"'),
  promptPanelPostsJobEntry: source.promptPanel.includes('fetch("/api/jobs"'),
  billingCheckoutEntry: source.pricing.includes('fetch("/api/billing/checkout"'),
  checkInEntry: source.shell.includes('fetch("/api/check-in", { method: "POST" })')
};

const entryMatrix = [
  {
    group: "transcription",
    targetPaths: ["", "ai-speech-to-text"],
    sourceType: "speech_to_text",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"speech_to_text"'),
      frontendPostsUpload: sharedChecks.jobFormPostsUploadEntry,
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      defaultJobMapping: source.toolPage.includes('return "speech_to_text"'),
      webApiAcceptsType: source.webJobsApi.includes('z.enum(devoiceJobTypes)'),
      inlineOrProviderFallback: source.webJobsApi.includes("shouldCompleteTranscriptionInline(input)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "speech_to_text"')
    }
  },
  {
    group: "transcription",
    targetPaths: ["audio-to-text"],
    sourceType: "audio_to_text",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"audio_to_text"'),
      frontendPostsUpload: sharedChecks.jobFormPostsUploadEntry,
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      defaultJobMapping: source.toolPage.includes('slug === "audio-to-text") return "audio_to_text"'),
      inlineOrProviderFallback: source.webJobsApi.includes("shouldCompleteTranscriptionInline(input)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "audio_to_text"')
    }
  },
  {
    group: "transcription",
    targetPaths: ["video-to-text"],
    sourceType: "video_to_text",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"video_to_text"'),
      frontendPostsUpload: sharedChecks.jobFormPostsUploadEntry,
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      defaultJobMapping: source.toolPage.includes('slug === "video-to-text") return "video_to_text"'),
      inlineOrProviderFallback: source.webJobsApi.includes("shouldCompleteTranscriptionInline(input)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "video_to_text"')
    }
  },
  {
    group: "youtube",
    targetPaths: ["transcribe-youtube-videos", "youtube-transcript-generator"],
    sourceType: "youtube_transcript",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"youtube_transcript"'),
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      frontendValidatesYoutube: source.jobForm.includes("isYoutubeUrl(sourceUrl)"),
      webApiRequiresYoutubeUrl: source.webJobsApi.includes("isYoutubeJobType(parsed.data.sourceType)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "youtube_transcript"')
    }
  },
  {
    group: "youtube",
    targetPaths: ["youtube-subtitle-downloader"],
    sourceType: "youtube_subtitle",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"youtube_subtitle"'),
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      defaultJobMapping: source.toolPage.includes('slug === "youtube-subtitle-downloader") return "youtube_subtitle"'),
      subtitleTargetEncoding: source.jobForm.includes("encodeSubtitleTarget(targetLanguage, subtitleFormat)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "youtube_subtitle"')
    }
  },
  {
    group: "youtube",
    targetPaths: ["youtube-video-summarizer"],
    sourceType: "youtube_summary",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"youtube_summary"'),
      frontendPostsJob: sharedChecks.jobFormPostsJobEntry,
      defaultJobMapping: source.toolPage.includes('slug === "youtube-video-summarizer") return "youtube_summary"'),
      webApiRequiresYoutubeUrl: source.webJobsApi.includes("isYoutubeJobType(parsed.data.sourceType)"),
      resultSupportsType: source.jobResult.includes('job.sourceType === "youtube_summary"')
    }
  },
  {
    group: "audio-tools",
    targetPaths: ["remove-background-noise", "ai-noise-filter"],
    sourceType: "remove_noise",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"remove_noise"'),
      frontendPostsUpload: sharedChecks.noiseUploadPostsUploadEntry,
      frontendPostsJob: sharedChecks.noiseUploadPostsJobEntry,
      defaultNoisePanel: source.toolPage.includes("<NoiseUploadPanel"),
      webApiInlineOrProvider: source.webJobsApi.includes('input.sourceType === "remove_noise"') || source.webJobsApi.includes('sourceType === "remove_noise"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "remove_noise"')
    }
  },
  {
    group: "audio-tools",
    targetPaths: ["ai-voice-enhancer-isolate"],
    sourceType: "voice_enhance",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"voice_enhance"'),
      frontendPostsUpload: sharedChecks.noiseUploadPostsUploadEntry,
      frontendPostsJob: sharedChecks.noiseUploadPostsJobEntry,
      mountedWithSourceType: source.toolPage.includes('sourceType="voice_enhance"'),
      webApiInlineOrProvider: source.webJobsApi.includes('input.sourceType === "voice_enhance"') || source.webJobsApi.includes('sourceType === "voice_enhance"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "voice_enhance"')
    }
  },
  {
    group: "audio-tools",
    targetPaths: ["ai-voice-changer"],
    sourceType: "voice_change",
    endpoint: "/api/jobs plus optional /api/uploads",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"voice_change"'),
      frontendMountedWithSourceType: source.toolPage.includes('config.kind === "voice-change" ? "voice_change"'),
      frontendPostsJob: sharedChecks.voicePanelPostsJobEntry,
      optionalUploadAvailable: sharedChecks.voicePanelPostsUploadEntry,
      webApiInlineOrProvider: source.webJobsApi.includes('input.sourceType === "voice_change"') || source.webJobsApi.includes('sourceType === "voice_change"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "voice_change"')
    }
  },
  {
    group: "audio-tools",
    targetPaths: ["audio-extract-from-video"],
    sourceType: "audio_extract",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"audio_extract"'),
      frontendPostsUpload: sharedChecks.noiseUploadPostsUploadEntry,
      frontendPostsJob: sharedChecks.noiseUploadPostsJobEntry,
      mountedWithSourceType: source.toolPage.includes('sourceType="audio_extract"'),
      webApiInlineCompletion: source.webJobsApi.includes('input.sourceType === "audio_extract"') || source.webJobsApi.includes('sourceType === "audio_extract"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "audio_extract"')
    }
  },
  {
    group: "voice",
    targetPaths: ["text-to-speech", "ai-voice-generator", "ai-voice-actors"],
    sourceType: "text_to_speech",
    endpoint: "/api/jobs plus optional /api/uploads",
    checks: {
      requiredVoiceEntryConfigured:
        sharedChecks.voicePanelDefaultSourceTypes &&
        sharedChecks.voicePanelPayloadContract &&
        sharedChecks.voicePanelMarksUploadedSamplesAsCustomTarget &&
        sharedChecks.webJobsAcceptsTextPayload &&
        sharedChecks.developerJobsAcceptsTextPayload &&
        sharedChecks.webJobsAcceptsLongVoiceLanguageCodes &&
        sharedChecks.developerJobsAcceptsLongVoiceLanguageCodes &&
        sharedChecks.webJobsLanguageSchemaCoversVoiceSettings &&
        sharedChecks.developerJobsLanguageSchemaCoversVoiceSettings &&
        sharedChecks.webJobsPersistsVoicePayload &&
        sharedChecks.developerJobsPersistsVoicePayload &&
        webRouteDefers("text_to_speech", source.webJobsApi),
      internalDemoCovered: sharedChecks.ttsInternalDemoPostsAndPolls,
      resultSupportsType: source.jobResult.includes('job.sourceType === "text_to_speech"')
    }
  },
  {
    group: "voice",
    targetPaths: ["ai-voice-cloning"],
    sourceType: "voice_clone",
    endpoint: "/api/uploads -> /api/jobs",
    checks: {
      requiredVoiceEntryConfigured:
        sharedChecks.voicePanelDefaultSourceTypes &&
        sharedChecks.voicePanelPayloadContract &&
        sharedChecks.voicePanelMarksUploadedSamplesAsCustomTarget &&
        sharedChecks.webJobsAcceptsTextPayload &&
        sharedChecks.developerJobsAcceptsTextPayload &&
        sharedChecks.webJobsAcceptsLongVoiceLanguageCodes &&
        sharedChecks.developerJobsAcceptsLongVoiceLanguageCodes &&
        sharedChecks.webJobsLanguageSchemaCoversVoiceSettings &&
        sharedChecks.developerJobsLanguageSchemaCoversVoiceSettings &&
        sharedChecks.webJobsPersistsVoicePayload &&
        sharedChecks.developerJobsPersistsVoicePayload &&
        sharedChecks.cloneRequiresSampleBeforeSubmit &&
        webRouteDefers("voice_clone", source.webJobsApi),
      resultSupportsType: source.jobResult.includes('job.sourceType === "voice_clone"')
    }
  },
  {
    group: "voice",
    targetPaths: ["ai-dubbing"],
    sourceType: "ai_dubbing",
    endpoint: "/api/jobs plus optional /api/uploads",
    checks: {
      relatedVoiceEntryConfigured: source.toolPage.includes('? "ai_dubbing"') && webRouteDefers("ai_dubbing", source.webJobsApi),
      resultSupportsType: source.jobResult.includes('job.sourceType === "ai_dubbing"')
    }
  },
  {
    group: "generators",
    targetPaths: ["ai-music-generator"],
    sourceType: "ai_music",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"ai_music"'),
      mountedWithSourceType: source.toolPage.includes('config.kind === "music" ? "ai_music"'),
      frontendPostsJob: sharedChecks.promptPanelPostsJobEntry,
      webApiInlineCompletion: source.webJobsApi.includes('input.sourceType === "ai_music"') || source.webJobsApi.includes('sourceType === "ai_music"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "ai_music"')
    }
  },
  {
    group: "generators",
    targetPaths: ["ai-rap-generator"],
    sourceType: "ai_rap",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"ai_rap"'),
      mountedWithSourceType: source.toolPage.includes('config.kind === "rap" ? "ai_rap"'),
      frontendPostsJob: sharedChecks.promptPanelPostsJobEntry,
      webApiInlineCompletion: source.webJobsApi.includes('input.sourceType === "ai_rap"') || source.webJobsApi.includes('sourceType === "ai_rap"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "ai_rap"')
    }
  },
  {
    group: "generators",
    targetPaths: ["ai-rap-lyrics-generator"],
    sourceType: "rap_lyrics",
    endpoint: "/api/jobs",
    checks: {
      jobTypeAllowed: source.jobTypes.includes('"rap_lyrics"'),
      mountedWithSourceType: source.toolPage.includes('"rap_lyrics"'),
      frontendPostsJob: sharedChecks.promptPanelPostsJobEntry,
      webApiInlineCompletion: source.webJobsApi.includes('input.sourceType === "rap_lyrics"') || source.webJobsApi.includes('sourceType === "rap_lyrics"'),
      resultSupportsType: source.jobResult.includes('job.sourceType === "rap_lyrics"')
    }
  },
  {
    group: "commerce",
    targetPaths: ["pricing"],
    sourceType: "billing_checkout",
    endpoint: "/api/billing/checkout",
    checks: {
      frontendPostsCheckout: sharedChecks.billingCheckoutEntry,
      checkoutApiExists: fs.existsSync(path.join(repoRoot, "app/api/billing/checkout/route.ts")),
      pricingPageExists: source.toolPage.includes('"pricing"') || fs.existsSync(path.join(repoRoot, "app/[locale]/pricing/page.tsx"))
    }
  },
  {
    group: "credits",
    targetPaths: ["global-shell"],
    sourceType: "daily_check_in",
    endpoint: "/api/check-in",
    checks: {
      frontendPostsCheckIn: sharedChecks.checkInEntry,
      checkInApiExists: fs.existsSync(path.join(repoRoot, "app/api/check-in/route.ts")),
      opensAuthWhenAnonymous: source.shell.includes('openAuth("signin")')
    }
  }
];

const entryCoverage = entryMatrix.map((entry) => {
  const failedChecks = Object.entries(entry.checks).filter(([, passed]) => !passed).map(([name]) => name);
  return {
    ...entry,
    status: failedChecks.length ? "failing" : "covered",
    failedChecks
  };
});

const coverageByPath = flows.map((flow) => {
  const checks = {
    toolConfigKind: slugConfigHasKind(flow.targetPath, flow.expectedKind),
    defaultJobTypeMapping: defaultJobTypeMaps(flow.targetPath, flow.expectedSourceType),
    jobTypeAllowed: source.jobTypes.includes(`"${flow.expectedSourceType}"`),
    panelEntryMounted: sharedChecks.voicePanelMountedForVoiceKinds,
    uploadEndpointAvailable: sharedChecks.uploadsApiExists,
    uploadEndpointCalledWhenNeeded: flow.expectedSourceType === "voice_clone"
      ? sharedChecks.voicePanelPostsUploadEntry && sharedChecks.cloneRequiresSampleBeforeSubmit
      : sharedChecks.voicePanelPostsUploadEntry,
    targetDefaultCustomVoiceState: sharedChecks.targetDefaultCustomVoiceState,
    speechCustomDefaultCanSubmitWithoutUpload: flow.expectedSourceType !== "text_to_speech" || sharedChecks.speechCustomDefaultCanSubmitWithoutUpload,
    jobEndpointCalled: sharedChecks.voicePanelPostsJobEntry,
    clientPayloadCarriesExpectedSourceType: flow.expectedSourceType === "text_to_speech" || flow.expectedSourceType === "voice_clone"
      ? sharedChecks.voicePanelDefaultSourceTypes
      : source.toolPage.includes(`? "ai_dubbing"`),
    clientPayloadCarriesProviderContract: sharedChecks.voicePanelPayloadContract,
    webApiAcceptsTextPayload: sharedChecks.webJobsAcceptsTextPayload,
    developerApiAcceptsTextPayload: sharedChecks.developerJobsAcceptsTextPayload,
    webApiAcceptsLongVoiceLanguageCodes: sharedChecks.webJobsAcceptsLongVoiceLanguageCodes,
    developerApiAcceptsLongVoiceLanguageCodes: sharedChecks.developerJobsAcceptsLongVoiceLanguageCodes,
    webApiLanguageSchemaCoversVoiceSettings: sharedChecks.webJobsLanguageSchemaCoversVoiceSettings,
    developerApiLanguageSchemaCoversVoiceSettings: sharedChecks.developerJobsLanguageSchemaCoversVoiceSettings,
    webApiPersistsProviderPayload: sharedChecks.webJobsPersistsVoicePayload,
    developerApiPersistsProviderPayload: sharedChecks.developerJobsPersistsVoicePayload,
    webApiAcceptsAndDefers: webRouteDefers(flow.expectedSourceType, source.webJobsApi),
    developerApiAcceptsAndDefers: webRouteDefers(flow.expectedSourceType, source.developerJobsApi),
    providerHooksPresentForFutureIntegration: providerHooksFor(flow.expectedSourceType),
    demoCompletionAvailable: sharedChecks.demoCompletionExists
  };
  const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);

  return {
    ...flow,
    frontendComponent: "components/devoice-voice-panel.tsx",
    endpoints: flow.expectedSourceType === "voice_clone" ? ["/api/uploads", "/api/jobs", "/api/v1/jobs"] : ["/api/jobs", "/api/uploads (custom voice only)", "/api/v1/jobs"],
    deferredBusinessFlow: true,
    checks,
    status: failedChecks.length ? "failing" : "covered",
    failedChecks
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  scope: "Static function-entry audit for DeVoice target voice generation pages.",
  notes: [
    "This verifies that the local pages expose backend entry points and deferred/demo completion paths. It is not proof of third-party provider integration.",
    "The voice panel payload contract is guarded so future provider integrations receive sourceType, sourceUrl, optional storageKey, fileName, language, and targetLanguage.",
    "The required user scope is text-to-speech plus ai-voice-cloning; ai-voice-generator and ai-voice-actors are same-flow aliases, and ai-dubbing shares the deferred voice entry.",
    "The Web route and developer API intentionally call completeJobWithDemoResult for deferred voice entries before provider execution; provider hooks remain present in lib/devoice-voice-processing.ts for later integration."
  ],
  inspectedFiles: files,
  voiceSettingsSchemaCoverage: {
    voiceLanguageCodeCount: voiceLanguageCodes.length,
    longestVoiceLanguageCode,
    longestVoiceLanguageCodeLength: longestVoiceLanguageCode.length,
    voiceIdCount: voiceIds.length,
    longestVoiceId,
    longestVoiceIdLength: longestVoiceId.length,
    customTargetLanguageLength: "custom".length,
    webLanguageMax,
    webTargetLanguageMax,
    developerLanguageMax,
    developerTargetLanguageMax
  },
  sharedChecks,
  requiredCoveredCount: coverageByPath.filter((item) => item.priority === "required" && item.status === "covered").length,
  requiredCount: coverageByPath.filter((item) => item.priority === "required").length,
  coveredCount: coverageByPath.filter((item) => item.status === "covered").length,
  totalCount: coverageByPath.length,
  coverageByPath,
  entryMatrixCoveredCount: entryCoverage.filter((item) => item.status === "covered").length,
  entryMatrixCount: entryCoverage.length,
  entryCoverage
};

fs.mkdirSync(path.dirname(path.join(repoRoot, outputPath)), { recursive: true });
fs.writeFileSync(path.join(repoRoot, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Required covered: ${report.requiredCoveredCount}/${report.requiredCount}`);
console.log(`Total covered: ${report.coveredCount}/${report.totalCount}`);
console.log(`Entry matrix covered: ${report.entryMatrixCoveredCount}/${report.entryMatrixCount}`);

const failures = [
  ...coverageByPath.filter((item) => item.status !== "covered"),
  ...entryCoverage.filter((item) => item.status !== "covered")
];
for (const item of failures) {
  console.log(`${item.targetPath ?? item.sourceType}: ${item.failedChecks.join(", ")}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
