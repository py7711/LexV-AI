import type { Metadata } from "next";

export const locales = [
  "en",
  "it",
  "es",
  "de",
  "fr",
  "pt",
  "br",
  "vi",
  "ru",
  "id",
  "ja",
  "hi",
  "ar",
  "bn",
  "ur",
  "zh-cn",
  "zh-tw"
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  br: "Português (Brasil)",
  vi: "Tiếng Việt",
  ru: "Русский",
  id: "Bahasa Indonesia",
  ja: "日本語",
  hi: "हिन्दी",
  ar: "العربية",
  bn: "বাংলা",
  ur: "اردو",
  "zh-cn": "简体中文",
  "zh-tw": "繁體中文"
};

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const languageAlternates = Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}`]));

export function localizedPath(locale: Locale, path = "") {
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return locale === defaultLocale ? normalizedPath || "/" : `/${locale}${normalizedPath}`;
}

export function publicPath(path = "") {
  return localizedPath(defaultLocale, path);
}

type PublicText = {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  shell: {
    home: string;
    aiTranscriber: string;
    audioToText: string;
    videoToText: string;
    speechToText: string;
    aiVoices: string;
    removeBackgroundNoise: string;
    textToSpeech: string;
    aiVoiceGenerator: string;
    aiDubbing: string;
    aiVoiceActors: string;
    aiVoiceCloning: string;
    aiVoiceEnhancer: string;
    aiVoiceChanger: string;
    aiMusicGenerator: string;
    aiRapGenerator: string;
    aiRapLyricsGenerator: string;
    aiYoutube: string;
    youtubeTranscriptGenerator: string;
    youtubeSubtitleDownloader: string;
    youtubeVideoSummarizer: string;
    myResources: string;
    pricing: string;
    quickHome: string;
    quickMyResources: string;
    quickPricing: string;
    feedback: string;
    credits: string;
    checkIn: string;
    buy: string;
    signIn: string;
    freeUser: string;
    vipUser: string;
    privacyPolicy: string;
    refundPolicy: string;
    termsOfUse: string;
    signOut: string;
    limitedDeal: string;
    promo: string;
    claimNow: string;
    rewardTitle: string;
    rewardBody: string;
    todayReward: string;
    claim: string;
    creditsNeverExpire: string;
    creditDetails: string;
    paidCredits: string;
    freeCredits: string;
  };
  auth: {
    welcome: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    loginReward: string;
    continueGoogle: string;
    divider: string;
    email: string;
    password: string;
    forgot: string;
    submitSignIn: string;
    submitSignUp: string;
    noAccount: string;
    haveAccount: string;
    signUp: string;
    termsPrefix: string;
    terms: string;
    and: string;
    privacy: string;
    incorrect: string;
    registered: string;
    passwordHelp: string;
    googleUnavailable: string;
    resetTitle: string;
    resetSubtitle: string;
    resetSubmit: string;
    resetSuccess: string;
    resetFailed: string;
    rememberPassword: string;
  };
  feedback: {
    title: string;
    subtitle: string;
    problemTitle: string;
    problemHint: string;
    options: Array<[string, string]>;
    severityTitle: string;
    severity: Array<[string, string]>;
    noteLabel: string;
    notePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    send: string;
    sending: string;
    sent: string;
    success: string;
    error: string;
  };
  dashboard: {
    title: string;
    description: string;
    buyCredits: string;
    buy: string;
    freeCredits: string;
    paidCredits: string;
    creditsUsed: string;
    quotaUsage: string;
    creditsAvailable: string;
    completed: string;
    inProgress: string;
    needsRetry: string;
    creditsTitle: string;
    creditsBody: string;
    creditsLeft: string;
    claimNow: string;
    quickTools: string;
    viewAll: string;
    history: string;
    openConverter: string;
    fileLink: string;
    type: string;
    status: string;
    outputs: string;
    created: string;
    emptyHistory: string;
    recentExports: string;
    quickSpeechTitle: string;
    quickSpeechDescription: string;
    quickYoutubeTitle: string;
    quickYoutubeDescription: string;
    quickNoiseTitle: string;
    quickNoiseDescription: string;
    quickTtsTitle: string;
    quickTtsDescription: string;
  };
  resources: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    retention: string;
    name: string;
    uploaded: string;
    duration: string;
    status: string;
    operation: string;
    opening: string;
    open: string;
    deleting: string;
    delete: string;
    deleteFailed: string;
    deleted: string;
    empty: string;
    total: string;
    rowsPerPage: string;
    previousPage: string;
    nextPage: string;
    deleteDialog: string;
    cancel: string;
    close: string;
    resourceFallback: string;
  };
  pricing: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    oneTime: string;
    subscription: string;
    oneTimeDescription: string;
    subscriptionNotice: string;
    monthly: string;
    yearly: string;
    save37: string;
    entryPackage: string;
    standardPackage: string;
    comprehensivePackage: string;
    elitePackage: string;
    basicPlan: string;
    proPlan: string;
    elitePlan: string;
    lightUsersAndBeginners: string;
    regularUsers: string;
    contentCreatorsAndSmallTeams: string;
    heavyCreatorsAgencies: string;
    perfectLightUsers: string;
    bestValueCreators: string;
    powerUsersTeams: string;
    mostPopularChoice: string;
    perMonth: string;
    per600Credits: string;
    creditsPerMonth: string;
    minutesPerMonth: string;
    usesPerMonth: string;
    secondsApproxMinutes: string;
    selectedPlan: string;
    totalPrice: string;
    buyCreditsNow: string;
    oneTimePurchase: string;
    usageEstimate: string;
    value: string;
    bestFor: string;
    subscribeNow: string;
    creditPackage: string;
    creditPackagePrice: string;
    creditPackageIdeal: string;
    creditPackageNote: string;
    buyCreditPackage: string;
    unableBilling: string;
    aiTranscriber: string;
    aiMusic: string;
    aiVoice: string;
    aiSeparation: string;
    upTo: string;
    equivalentTo: string;
    priorityQueue: string;
    unlimitedDownloads: string;
    emailSupport: string;
    standardQueue: string;
    priorityEmailSupport: string;
    highestPriority: string;
    vipSupport: string;
    cannotReplaceSubscription: string;
    creditsNeverExpire: string;
  };
  hero: {
    title: string;
    description: string;
  };
  tool: {
    speechToText: string;
    removeNoise: string;
    textToSpeech: string;
    videoAudio: string;
    youtubeUrl: string;
    uploadTitle: string;
    uploadHelp: string;
    youtubeTitle: string;
    youtubeHelp: string;
    youtubeSubtitleHelp: string;
    youtubeSummaryHelp: string;
    youtubeTranscriptHelp: string;
    youtubeSubtitleHint: string;
    youtubeSummaryHint: string;
    youtubeTranscriptHint: string;
    youtubeStageHelp: string;
    pasteLink: string;
    inputMode: string;
    jobType: string;
    targetLanguage: string;
    subtitleLanguage: string;
    subtitleFormat: string;
    voiceLanguage: string;
    voice: string;
    formats: string;
    uploadFiles: string;
    chooseFile: string;
    pastePlaceholder: string;
    getTranscript: string;
    downloadSubtitle: string;
    summarizeVideo: string;
    generate: string;
    ttsPlaceholder: string;
    ttsInputLabel: string;
    enterTextFirst: string;
    validYoutubeUrl: string;
    prepareUploadError: string;
    uploadFailed: string;
    customVoiceUploadError: string;
    voiceSampleUploadError: string;
    createVoiceJobError: string;
    unableGenerate: string;
    previewUnsupported: string;
    enterTextStatus: string;
    uploadVoiceSample: string;
    generating: string;
    previewReady: string;
    voiceReady: string;
    languageLabel: string;
    voiceLabel: string;
    newLabel: string;
    customVoice: string;
    uploadMp3File: string;
    voiceExamples: string;
    featuredVoiceExamples: string;
    previewVoice: string;
    playing: string;
    example: string;
    history: string;
    noiseSteps: string[];
    noiseProgress: Array<[string, string]>;
    noiseProgressLabel: string;
    noiseSignInRequired: string;
    removeNoiseError: string;
    voiceEnhanceSteps: string[];
    voiceEnhanceProgress: Array<[string, string]>;
    voiceEnhanceProgressLabel: string;
    voiceEnhanceSignInRequired: string;
    voiceEnhanceError: string;
    voiceChangeSignInRequired: string;
    voiceChangeError: string;
    dropAudioVideo: string;
    dropHelp: string;
    dropVoiceAudio: string;
    dropVoiceHelp: string;
    dropVoiceChangeHelp: string;
    processing: string;
    chooseFileShort: string;
    acceptedFormats: string;
    voiceEnhanceAcceptedFormats: string;
    submitting: string;
    signInRequired: string;
    pasteLinkFirst: string;
    chooseFileFirst: string;
    created: string;
    waiting: string;
    queued: string;
    checkInput: string;
    examples: string;
    recommendedTools: string;
  };
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown> ? T[K] : T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

const commonKeywords = [
  "DeVoice",
  "speech to text",
  "audio to text",
  "video to text",
  "YouTube transcript generator",
  "AI transcription",
  "text to speech",
  "remove background noise"
];

const en: PublicText = {
  meta: {
    title: "DeVoice | Free Speech to Text Converter & AI Transcription",
    description:
      "DeVoice is an online AI transcription workspace for speech to text, audio to text, video to text, YouTube transcripts, summaries, noise removal and text to speech.",
    keywords: commonKeywords
  },
  shell: {
    home: "Home",
    aiTranscriber: "AI Transcriber",
    audioToText: "Audio To Text",
    videoToText: "Video To Text",
    speechToText: "AI Speech to Text",
    aiVoices: "AI Voices",
    removeBackgroundNoise: "Remove Background Noise",
    textToSpeech: "Text To Speech",
    aiVoiceGenerator: "AI Voice Generator",
    aiDubbing: "AI Dubbing",
    aiVoiceActors: "AI Voice Actors",
    aiVoiceCloning: "AI Voice Cloning",
    aiVoiceEnhancer: "AI Voice Enhancer",
    aiVoiceChanger: "AI Voice Changer",
    aiMusicGenerator: "AI Music Generator",
    aiRapGenerator: "AI Rap Generator",
    aiRapLyricsGenerator: "AI Rap Lyrics Generator",
    aiYoutube: "AI YouTube",
    youtubeTranscriptGenerator: "Youtube Transcript Generator",
    youtubeSubtitleDownloader: "Youtube Subtitle Downloader",
    youtubeVideoSummarizer: "Youtube Video Summarizer",
    myResources: "My Resources",
    pricing: "Pricing",
    quickHome: "Home",
    quickMyResources: "My Resources",
    quickPricing: "Pricing",
    feedback: "Feedback",
    credits: "Credits",
    checkIn: "Check-in",
    buy: "Buy",
    signIn: "Sign in",
    freeUser: "Free User",
    vipUser: "VIP User",
    privacyPolicy: "Privacy & Policy",
    refundPolicy: "Refund Policy",
    termsOfUse: "Terms of Use",
    signOut: "Sign Out",
    limitedDeal: "Limited Deal",
    promo: "Up to 5,000 credits granted! Up to 30% OFF",
    claimNow: "Claim Now",
    rewardTitle: "Claim your daily free credit!",
    rewardBody: "Click the [Claim] button below to receive 10 credits every day.",
    todayReward: "Today's Reward",
    claim: "Claim",
    creditsNeverExpire: "Credits never expire",
    creditDetails: "Credit Details",
    paidCredits: "Paid credits",
    freeCredits: "Free credits"
  },
  auth: {
    welcome: "Welcome to DeVoice",
    signInSubtitle: "Sign in to continue",
    signUpSubtitle: "Create your DeVoice account",
    loginReward: "Log in to claim free daily usage 🎉 or continue with email",
    continueGoogle: "Continue with Google",
    divider: "OR CONTINUE WITH EMAIL",
    email: "Email address",
    password: "Password",
    forgot: "Forgot password?",
    submitSignIn: "Sign In",
    submitSignUp: "Sign Up",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign up",
    termsPrefix: "By continuing, you agree to our",
    terms: "Terms of Use",
    and: "and",
    privacy: "Privacy Policy",
    incorrect: "Email or password is incorrect.",
    registered: "Account created. You are signed in.",
    passwordHelp: "Use at least 8 characters.",
    googleUnavailable: "Google sign-in is not configured in this local build.",
    resetTitle: "Reset your password",
    resetSubtitle: "Enter your email and we will send password reset instructions.",
    resetSubmit: "Send reset instructions",
    resetSuccess: "If an account exists, reset instructions have been sent.",
    resetFailed: "Unable to request a password reset right now.",
    rememberPassword: "Remember your password?"
  },
  feedback: {
    title: "DeVoice Quick Feedback",
    subtitle: "Having an issue? Let us know in 10 seconds.",
    problemTitle: "1. What problem did you face?",
    problemHint: "Select the closest option below.",
    options: [
      ["Too slow", "(processing takes too long)"],
      ["Poor audio quality", "(noise not removed well)"],
      ["Transcription not accurate", ""],
      ["YouTube link not working", ""],
      ["Interface is confusing", ""],
      ["Feature not working", ""],
      ["Other", ""]
    ],
    severityTitle: "2. How serious is this issue?",
    severity: [
      ["Blocking", "(I can't use the tool)"],
      ["Annoying", "(affects experience)"],
      ["Minor", ""],
      ["Feedback", "(suggestion)"]
    ],
    noteLabel: "3. (Optional) Tell us in one sentence",
    notePlaceholder: "Describe your issue...",
    emailLabel: "4. (Optional) Your email (only if you want a reply)",
    emailPlaceholder: "your@email.com",
    send: "Send Feedback",
    sending: "Sending...",
    sent: "Sent",
    success: "Thanks, feedback received.",
    error: "Unable to send feedback."
  },
  dashboard: {
    title: "Dashboard",
    description: "Track credits, processing history, downloads, and quick DeVoice tools.",
    buyCredits: "Buy credits",
    buy: "Buy",
    freeCredits: "Free credits",
    paidCredits: "Paid credits",
    creditsUsed: "credits used",
    quotaUsage: "Quota usage",
    creditsAvailable: "Credits available",
    completed: "Completed",
    inProgress: "In progress",
    needsRetry: "Needs retry",
    creditsTitle: "Daily free credits",
    creditsBody: "Claim 10 free credits every day. Credits never expire and can be used for transcripts, subtitles, summaries and voices.",
    creditsLeft: "credits left",
    claimNow: "Claim Now",
    quickTools: "Quick tools",
    viewAll: "View all",
    history: "History",
    openConverter: "Open converter",
    fileLink: "File / link",
    type: "Type",
    status: "Status",
    outputs: "Outputs",
    created: "Created",
    emptyHistory: "No transcription history yet. Open the converter to upload audio, video or paste a YouTube URL.",
    recentExports: "Recent exports",
    quickSpeechTitle: "Speech to Text",
    quickSpeechDescription: "Upload audio or video",
    quickYoutubeTitle: "YouTube Transcript",
    quickYoutubeDescription: "Paste a YouTube URL",
    quickNoiseTitle: "Remove Noise",
    quickNoiseDescription: "Clean background noise",
    quickTtsTitle: "Text to Speech",
    quickTtsDescription: "Generate natural voices"
  },
  resources: {
    metaTitle: "My Resources - DeVoice",
    metaDescription: "Manage your transcription history and quickly reopen records.",
    title: "My Resources",
    description: "Manage your transcription history and reopen previous records.",
    retention: "History stored for 7 days",
    name: "Name",
    uploaded: "Uploaded",
    duration: "Duration",
    status: "Status",
    operation: "Operation",
    opening: "Opening",
    open: "Open",
    deleting: "Deleting",
    delete: "Delete",
    deleteFailed: "Delete failed.",
    deleted: "Deleted successfully.",
    empty: "No history records",
    total: "Total",
    rowsPerPage: "Rows per page",
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    deleteDialog: "Delete this record?",
    cancel: "Cancel",
    close: "Close",
    resourceFallback: "resource"
  },
  pricing: {
    metaTitle: "Pricing - DeVoice",
    metaDescription: "Choose DeVoice credits or subscriptions for transcription, subtitles, summaries, voices and audio cleanup.",
    title: "Choose Your Plan",
    oneTime: "One-time credits",
    subscription: "Subscription",
    oneTimeDescription: "Buy credits once - no subscription. Credits never expire.",
    subscriptionNotice: "Subscription service is broken; you can prioritize purchasing credit packages.",
    monthly: "Monthly",
    yearly: "Yearly",
    save37: "Save 37%",
    entryPackage: "Entry Package",
    standardPackage: "Standard Package",
    comprehensivePackage: "Comprehensive Package",
    elitePackage: "Elite Package",
    basicPlan: "Basic Plan",
    proPlan: "Pro Plan",
    elitePlan: "Elite Plan",
    lightUsersAndBeginners: "Light users and beginners",
    regularUsers: "Regular users",
    contentCreatorsAndSmallTeams: "Content creators and small teams",
    heavyCreatorsAgencies: "Heavy creators, agencies, and professionals",
    perfectLightUsers: "Perfect for light users",
    bestValueCreators: "Best value for creators",
    powerUsersTeams: "For power users & teams",
    mostPopularChoice: "Most popular choice",
    perMonth: "/ month",
    per600Credits: "/ 600 credits",
    creditsPerMonth: "credits / month",
    minutesPerMonth: "minutes / month",
    usesPerMonth: "uses / month",
    secondsApproxMinutes: "seconds (≈ {minutes} minutes)",
    selectedPlan: "Selected plan:",
    totalPrice: "Total price:",
    buyCreditsNow: "Buy Credits Now",
    oneTimePurchase: "One-time purchase. Credits never expire.",
    usageEstimate: "Usage Estimate:",
    value: "Value:",
    bestFor: "Best for:",
    subscribeNow: "Subscribe Now",
    creditPackage: "Credit Package",
    creditPackagePrice: "$4.99 / 600 credits",
    creditPackageIdeal: "Ideal for: Temporary top-up when subscription credits run out",
    creditPackageNote: "Note: Credit package does not unlock premium features",
    buyCreditPackage: "Buy Credit Package",
    unableBilling: "Unable to create a billing session.",
    aiTranscriber: "AI Transcriber",
    aiMusic: "AI Music",
    aiVoice: "AI Voice & Song Lyrics",
    aiSeparation: "AI Audio Separation & Noise Reduction",
    upTo: "up to",
    equivalentTo: "Equivalent to",
    priorityQueue: "Priority processing queue",
    unlimitedDownloads: "Unlimited file downloads",
    emailSupport: "Email support",
    standardQueue: "Standard processing queue",
    priorityEmailSupport: "Priority email support",
    highestPriority: "Highest priority processing",
    vipSupport: "VIP dedicated support",
    cannotReplaceSubscription: "Cannot replace subscription",
    creditsNeverExpire: "Credits never expire"
  },
  hero: {
    title: "Free Speech to Text Converter",
    description: "Upload your document to transcribe it into the most accurate text."
  },
  tool: {
    speechToText: "Speech to Text",
    removeNoise: "Remove Noise",
    textToSpeech: "Text to Speech",
    videoAudio: "Video, Audio",
    youtubeUrl: "YouTube Url",
    uploadTitle: "Upload or drag audio / video",
    uploadHelp: "Max 1GB",
    youtubeTitle: "Paste a YouTube URL",
    youtubeHelp: "Generate transcripts and summaries from public videos",
    youtubeSubtitleHelp: "Choose subtitle language and format, then download captions from a public video.",
    youtubeSummaryHelp: "Paste a public video URL and generate an AI summary with chapters and keywords.",
    youtubeTranscriptHelp: "Paste a public video URL and generate a readable transcript.",
    youtubeSubtitleHint: "Public YouTube URL · SRT · VTT · TXT",
    youtubeSummaryHint: "Public YouTube URL · AI summary · chapters · keywords",
    youtubeTranscriptHint: "Public YouTube URL · transcript · TXT · SRT",
    youtubeStageHelp: "Supports YouTube videos, Shorts, podcasts, and audio links.",
    pasteLink: "Paste link",
    inputMode: "Input mode",
    jobType: "Job type",
    targetLanguage: "Target language",
    subtitleLanguage: "Subtitle language",
    subtitleFormat: "Subtitle format",
    voiceLanguage: "Voice language",
    voice: "Voice",
    formats: "mp3 · wav · mp4 · mov · webm · m4a",
    uploadFiles: "Upload Files",
    chooseFile: "Choose audio / video file",
    pastePlaceholder: "For example: https://www.youtube.com/watch?v=example",
    getTranscript: "Get Transcript",
    downloadSubtitle: "Download Subtitle",
    summarizeVideo: "Summarize Video",
    generate: "Generate",
    ttsPlaceholder: "Please enter the text you want to convert into natural tone.",
    ttsInputLabel: "Text to speech input",
    enterTextFirst: "Please enter text first.",
    validYoutubeUrl: "Please paste a valid YouTube video URL.",
    prepareUploadError: "Unable to prepare upload. Please try again.",
    uploadFailed: "Upload failed",
    customVoiceUploadError: "Unable to prepare custom voice upload",
    voiceSampleUploadError: "Unable to upload voice sample",
    createVoiceJobError: "Unable to create voice job",
    unableGenerate: "Unable to generate",
    previewUnsupported: "Audio preview is not supported in this browser",
    enterTextStatus: "Enter text first",
    uploadVoiceSample: "Upload a voice sample",
    generating: "Generating...",
    previewReady: "Preview ready",
    voiceReady: "Voice ready",
    languageLabel: "Language:",
    voiceLabel: "Voice:",
    newLabel: "NEW",
    customVoice: "Custom Voice - Use your favorite voice",
    uploadMp3File: "Upload mp3 file",
    voiceExamples: "Voice examples",
    featuredVoiceExamples: "Featured voice examples",
    previewVoice: "Preview voice",
    playing: "Playing",
    example: "Example",
    history: "History",
    noiseSteps: ["Add file", "Upload", "Separate", "Listen"],
    noiseProgress: [
      ["Preparing file", "Checking the selected media before upload."],
      ["Uploading securely", "Sending your file to DeVoice for processing."],
      ["Separating noise", "AI is isolating speech and reducing background noise."],
      ["Clean audio ready", "Opening your cleaned result page."]
    ],
    noiseProgressLabel: "Noise removal progress",
    noiseSignInRequired: "Sign in to upload and remove noise from this file.",
    removeNoiseError: "Unable to remove background noise. Please try again.",
    voiceEnhanceSteps: ["Add file", "Upload", "Isolate", "Listen"],
    voiceEnhanceProgress: [
      ["Preparing file", "Checking the voice recording before upload."],
      ["Uploading securely", "Sending your file to DeVoice for voice enhancement."],
      ["Isolating voice", "AI is isolating speech and improving voice clarity."],
      ["Enhanced voice ready", "Opening your enhanced voice result page."]
    ],
    voiceEnhanceProgressLabel: "Voice enhancement progress",
    voiceEnhanceSignInRequired: "Sign in to upload and enhance this voice file.",
    voiceEnhanceError: "Unable to enhance and isolate voice. Please try again.",
    voiceChangeSignInRequired: "Sign in to upload and change this voice file.",
    voiceChangeError: "Unable to change this voice. Please try again.",
    dropAudioVideo: "Drop your audio or video here",
    dropHelp: "or use the button - files are processed on our servers",
    dropVoiceAudio: "Drop your voice audio or video here",
    dropVoiceHelp: "or use the button - DeVoice will isolate and enhance the voice",
    dropVoiceChangeHelp: "or use the button - DeVoice will create an AI voice-changer preview",
    processing: "Processing...",
    chooseFileShort: "Choose file",
    acceptedFormats: "Accepted formats include MP3, WAV, FLAC, AAC, OGG, AIFF, AVI, MP4, MKV.",
    voiceEnhanceAcceptedFormats: "Accepted formats include MP3, WAV, M4A, FLAC, AAC, OGG, MP4, MOV and WEBM.",
    submitting: "Submitting",
    signInRequired: "Sign in to DeVoice to claim free daily usage and process your file.",
    pasteLinkFirst: "Please paste a media link first.",
    chooseFileFirst: "Please choose a media file first.",
    created: "DeVoice resource created",
    waiting: "waiting",
    queued: "queued for processing",
    checkInput: "DeVoice could not create this resource. Please check your input.",
    examples: "Examples",
    recommendedTools: "Recommended Tools"
  }
};

const overrides: Partial<Record<Locale, DeepPartial<PublicText>>> = {
  "zh-cn": {
    meta: {
      title: "DeVoice | 免费语音转文字与 AI 转写",
      description: "DeVoice 是在线 AI 音视频工具，支持音频转文字、视频转文字、YouTube 转写、字幕摘要、降噪和文本转语音。",
      keywords: commonKeywords
    },
    shell: {
      home: "首页",
      aiTranscriber: "AI 转写",
      audioToText: "音频转文字",
      videoToText: "视频转文字",
      speechToText: "AI 语音转文字",
      aiVoices: "AI 声音",
      removeBackgroundNoise: "去除背景噪音",
      textToSpeech: "文本转语音",
      aiVoiceGenerator: "AI 语音生成器",
      aiDubbing: "AI 配音",
      aiVoiceActors: "AI 配音演员",
      aiVoiceCloning: "AI 声音克隆",
      aiVoiceEnhancer: "AI 人声增强",
      aiVoiceChanger: "AI 变声器",
      aiMusicGenerator: "AI 音乐生成器",
      aiRapGenerator: "AI Rap 生成器",
      aiRapLyricsGenerator: "AI Rap 歌词生成器",
      aiYoutube: "AI YouTube",
      youtubeTranscriptGenerator: "YouTube 文稿生成器",
      youtubeSubtitleDownloader: "YouTube 字幕下载器",
      youtubeVideoSummarizer: "YouTube 视频总结器",
      myResources: "我的资源",
      pricing: "价格",
      quickHome: "首页",
      quickMyResources: "我的资源",
      quickPricing: "价格",
      feedback: "反馈",
      credits: "积分",
      checkIn: "签到",
      buy: "购买",
      signIn: "登录",
      freeUser: "免费用户",
      vipUser: "VIP 用户",
      privacyPolicy: "隐私与政策",
      refundPolicy: "退款政策",
      termsOfUse: "使用条款",
      signOut: "退出登录",
      limitedDeal: "限时优惠",
      promo: "最高赠送 5,000 积分！最高 30% OFF",
      claimNow: "立即领取",
      rewardTitle: "领取每日免费积分！",
      rewardBody: "点击下方 [领取] 按钮，每天获得 10 积分。",
      todayReward: "今日奖励",
      claim: "领取",
      creditsNeverExpire: "积分永不过期",
      creditDetails: "积分详情",
      paidCredits: "付费积分",
      freeCredits: "免费积分"
    },
    auth: {
      welcome: "欢迎来到 DeVoice",
      signInSubtitle: "登录以继续",
      signUpSubtitle: "创建你的 DeVoice 账号",
      loginReward: "登录领取每日免费额度 🎉 或使用邮箱继续",
      continueGoogle: "使用 Google 继续",
      divider: "或使用邮箱继续",
      email: "邮箱地址",
      password: "密码",
      forgot: "忘记密码？",
      submitSignIn: "登录",
      submitSignUp: "注册",
      noAccount: "还没有账号？",
      haveAccount: "已有账号？",
      signUp: "注册",
      termsPrefix: "继续即表示你同意我们的",
      terms: "使用条款",
      and: "和",
      privacy: "隐私政策",
      incorrect: "邮箱或密码不正确。",
      registered: "账号已创建，已为你登录。",
      passwordHelp: "请至少输入 8 个字符。",
      googleUnavailable: "当前本地构建未配置 Google 登录。",
      resetTitle: "重置密码",
      resetSubtitle: "输入邮箱，我们会发送密码重置说明。",
      resetSubmit: "发送重置说明",
      resetSuccess: "如果该账号存在，重置说明已发送。",
      resetFailed: "暂时无法请求重置密码。",
      rememberPassword: "想起密码了？"
    },
    hero: {
      title: "免费语音转文字转换器",
      description: "上传你的文档，将其转写为最准确的文本。"
    },
    tool: {
      speechToText: "语音转文字",
      removeNoise: "去除噪音",
      textToSpeech: "文本转语音",
      videoAudio: "视频、音频",
      youtubeUrl: "YouTube 链接",
      uploadTitle: "上传或拖拽音频 / 视频",
      uploadHelp: "最大 1GB",
      youtubeTitle: "粘贴 YouTube URL",
      youtubeHelp: "从公开视频生成文稿和摘要",
      youtubeSubtitleHelp: "选择字幕语言和格式，然后从公开视频下载字幕。",
      youtubeSummaryHelp: "粘贴公开视频链接，生成带章节和关键词的 AI 摘要。",
      youtubeTranscriptHelp: "粘贴公开视频链接，生成可阅读的文稿。",
      youtubeSubtitleHint: "公开视频链接 · SRT · VTT · TXT",
      youtubeSummaryHint: "公开视频链接 · AI 摘要 · 章节 · 关键词",
      youtubeTranscriptHint: "公开视频链接 · 文稿 · TXT · SRT",
      youtubeStageHelp: "支持 YouTube 视频、Shorts、播客和音频链接。",
      pasteLink: "粘贴链接",
      inputMode: "输入模式",
      jobType: "任务类型",
      targetLanguage: "目标语言",
      subtitleLanguage: "字幕语言",
      subtitleFormat: "字幕格式",
      voiceLanguage: "语音语言",
      voice: "声音",
      formats: "mp3 · wav · mp4 · mov · webm · m4a",
      uploadFiles: "上传文件",
      chooseFile: "选择音频 / 视频文件",
      pastePlaceholder: "例如：https://www.youtube.com/watch?v=example",
      getTranscript: "获取文稿",
      downloadSubtitle: "下载字幕",
      summarizeVideo: "总结视频",
      generate: "生成",
      ttsPlaceholder: "请输入要转换成自然语音的文本。",
      ttsInputLabel: "文本转语音输入",
      enterTextFirst: "请先输入文本。",
      validYoutubeUrl: "请粘贴有效的 YouTube 视频链接。",
      prepareUploadError: "无法准备上传，请重试。",
      uploadFailed: "上传失败",
      customVoiceUploadError: "无法准备自定义声音上传。",
      voiceSampleUploadError: "无法上传声音样本。",
      createVoiceJobError: "无法创建语音任务。",
      unableGenerate: "无法生成。",
      previewUnsupported: "此浏览器不支持音频预览。",
      enterTextStatus: "请先输入文本",
      uploadVoiceSample: "请上传声音样本",
      generating: "生成中...",
      previewReady: "预览已准备好",
      voiceReady: "声音已生成",
      languageLabel: "语言：",
      voiceLabel: "声音：",
      newLabel: "NEW",
      customVoice: "自定义声音 - 使用你喜欢的声音",
      uploadMp3File: "上传 mp3 文件",
      voiceExamples: "声音示例",
      featuredVoiceExamples: "精选声音示例",
      previewVoice: "预览声音",
      playing: "播放中",
      example: "示例",
      history: "历史记录",
      noiseSteps: ["添加文件", "上传", "分离", "试听"],
      noiseProgress: [
        ["准备文件", "正在检查所选媒体。"],
        ["安全上传中", "正在将文件发送到 DeVoice 处理。"],
        ["分离噪音中", "AI 正在分离人声并降低背景噪音。"],
        ["干净音频已准备好", "正在打开清理后的结果页。"]
      ],
      noiseProgressLabel: "降噪进度",
      noiseSignInRequired: "登录后即可上传并去除噪音。",
      removeNoiseError: "无法去除背景噪音，请重试。",
      voiceEnhanceSteps: ["添加文件", "上传", "隔离", "试听"],
      voiceEnhanceProgress: [
        ["准备文件", "正在检查所选人声媒体。"],
        ["安全上传中", "正在将文件发送到 DeVoice 进行人声增强。"],
        ["隔离人声中", "AI 正在隔离语音并提升清晰度。"],
        ["增强人声已准备好", "正在打开增强后的人声结果页。"]
      ],
      voiceEnhanceProgressLabel: "人声增强进度",
      voiceEnhanceSignInRequired: "登录后即可上传并增强人声文件。",
      voiceEnhanceError: "无法增强和隔离人声，请重试。",
      voiceChangeSignInRequired: "登录后即可上传并转换人声文件。",
      voiceChangeError: "无法完成 AI 变声，请重试。",
      dropAudioVideo: "将音频或视频拖到这里",
      dropHelp: "或使用按钮上传 - 文件会在服务器上处理",
      dropVoiceAudio: "将人声音频或视频拖到这里",
      dropVoiceHelp: "或使用按钮上传 - DeVoice 会隔离并增强人声",
      dropVoiceChangeHelp: "或使用按钮上传 - DeVoice 会生成 AI 变声预览",
      processing: "处理中...",
      chooseFileShort: "选择文件",
      acceptedFormats: "支持格式包括 MP3、WAV、FLAC、AAC、OGG、AIFF、AVI、MP4、MKV。",
      voiceEnhanceAcceptedFormats: "支持格式包括 MP3、WAV、M4A、FLAC、AAC、OGG、MP4、MOV、WEBM。",
      submitting: "提交中",
      signInRequired: "登录 DeVoice 领取每日免费额度并处理文件。",
      pasteLinkFirst: "请先粘贴媒体链接。",
      chooseFileFirst: "请先选择音视频文件。",
      created: "DeVoice 资源已创建",
      waiting: "等待中",
      queued: "已加入处理队列",
      checkInput: "DeVoice 无法创建此资源，请检查输入。",
      examples: "示例",
      recommendedTools: "推荐工具"
    },
    dashboard: {
      title: "Dashboard",
      description: "查看 credits、处理记录、下载结果，并快速回到常用 DeVoice 工具。",
      buyCredits: "购买 credits",
      buy: "购买",
      freeCredits: "免费 credits",
      paidCredits: "付费 credits",
      creditsUsed: "credits 已使用",
      quotaUsage: "额度使用率",
      creditsAvailable: "可用 credits",
      completed: "已完成",
      inProgress: "处理中",
      needsRetry: "需重试",
      creditsTitle: "每日免费 credits",
      creditsBody: "每天领取 10 个免费 credits。Credits 永不过期，可用于转写、字幕、摘要和语音生成。",
      creditsLeft: "credits 剩余",
      claimNow: "立即领取",
      quickTools: "快捷工具",
      viewAll: "查看全部",
      history: "历史记录",
      openConverter: "打开转换器",
      fileLink: "文件 / 链接",
      type: "类型",
      status: "状态",
      outputs: "输出",
      created: "创建时间",
      emptyHistory: "暂无转写记录。打开转换器上传音频、视频或粘贴 YouTube URL。",
      recentExports: "最近导出",
      quickSpeechTitle: "语音转文字",
      quickSpeechDescription: "上传音频或视频",
      quickYoutubeTitle: "YouTube 文稿",
      quickYoutubeDescription: "粘贴 YouTube URL",
      quickNoiseTitle: "去除噪音",
      quickNoiseDescription: "清理背景噪音",
      quickTtsTitle: "文本转语音",
      quickTtsDescription: "生成自然声音"
    },
    resources: {
      metaTitle: "我的资源 - DeVoice",
      metaDescription: "管理你的转写历史，并快速重新打开记录。",
      title: "我的资源",
      description: "管理你的转写历史，并重新打开之前的记录。",
      retention: "历史记录保存 7 天",
      name: "名称",
      uploaded: "上传时间",
      duration: "时长",
      status: "状态",
      operation: "操作",
      opening: "打开中",
      open: "打开",
      deleting: "删除中",
      delete: "删除",
      deleteFailed: "删除失败。",
      deleted: "已成功删除。",
      empty: "暂无历史记录",
      total: "总计",
      rowsPerPage: "每页行数",
      previousPage: "上一页",
      nextPage: "下一页",
      deleteDialog: "删除这条记录？",
      cancel: "取消",
      close: "关闭",
      resourceFallback: "资源"
    },
    pricing: {
      metaTitle: "价格 - DeVoice",
      metaDescription: "选择 DeVoice credits 或订阅，用于转写、字幕、摘要、语音和音频清理。",
      title: "选择你的套餐",
      oneTime: "一次性 credits",
      subscription: "订阅",
      oneTimeDescription: "一次购买 credits，无需订阅。Credits 永不过期。",
      subscriptionNotice: "订阅服务暂不可用，你可以优先购买 credit 套餐。",
      monthly: "月付",
      yearly: "年付",
      save37: "节省 37%",
      entryPackage: "入门套餐",
      standardPackage: "标准套餐",
      comprehensivePackage: "综合套餐",
      elitePackage: "精英套餐",
      basicPlan: "基础套餐",
      proPlan: "专业套餐",
      elitePlan: "精英套餐",
      lightUsersAndBeginners: "轻量用户和初学者",
      regularUsers: "常规用户",
      contentCreatorsAndSmallTeams: "内容创作者和小团队",
      heavyCreatorsAgencies: "高频创作者、机构和专业人士",
      perfectLightUsers: "适合轻量用户",
      bestValueCreators: "最适合创作者",
      powerUsersTeams: "适合高频用户和团队",
      mostPopularChoice: "最受欢迎选择",
      perMonth: "/ 月",
      per600Credits: "/ 600 credits",
      creditsPerMonth: "credits / 月",
      minutesPerMonth: "分钟 / 月",
      usesPerMonth: "次 / 月",
      secondsApproxMinutes: "秒（约 {minutes} 分钟）",
      selectedPlan: "已选套餐：",
      totalPrice: "总价：",
      buyCreditsNow: "立即购买 Credits",
      oneTimePurchase: "一次性购买，credits 永不过期。",
      usageEstimate: "使用预估：",
      value: "价值：",
      bestFor: "适合：",
      subscribeNow: "立即订阅",
      creditPackage: "Credit 套餐",
      creditPackagePrice: "$4.99 / 600 credits",
      creditPackageIdeal: "适合：订阅 credits 用完后的临时补充",
      creditPackageNote: "注意：Credit 套餐不会解锁高级功能",
      buyCreditPackage: "购买 Credit 套餐",
      unableBilling: "无法创建支付会话。",
      aiTranscriber: "AI 转写",
      aiMusic: "AI 音乐",
      aiVoice: "AI 语音与歌词",
      aiSeparation: "AI 音频分离与降噪",
      upTo: "最多",
      equivalentTo: "相当于",
      priorityQueue: "优先处理队列",
      unlimitedDownloads: "无限文件下载",
      emailSupport: "邮件支持",
      standardQueue: "标准处理队列",
      priorityEmailSupport: "优先邮件支持",
      highestPriority: "最高优先级处理",
      vipSupport: "VIP 专属支持",
      cannotReplaceSubscription: "不能替代订阅",
      creditsNeverExpire: "Credits 永不过期"
    }
  },
  "zh-tw": {
    shell: {
      home: "首頁",
      myResources: "我的資源",
      pricing: "價格",
      feedback: "回饋",
      credits: "點數",
      checkIn: "簽到",
      buy: "購買",
      signIn: "登入",
      freeUser: "免費使用者",
      vipUser: "VIP 使用者",
      privacyPolicy: "隱私與政策",
      refundPolicy: "退款政策",
      termsOfUse: "使用條款",
      signOut: "登出",
      claimNow: "立即領取"
    },
    hero: {
      title: "免費語音轉文字轉換器",
      description: "上傳你的文件，將其轉寫為最準確的文字。"
    }
  },
  es: {
    shell: { home: "Inicio", feedback: "Comentarios", pricing: "Precios", signIn: "Iniciar sesión", credits: "Créditos", checkIn: "Registro", buy: "Comprar", myResources: "Mis recursos", freeUser: "Usuario gratis", signOut: "Cerrar sesión" },
    hero: { title: "Convertidor gratuito de voz a texto", description: "Sube tu archivo para transcribirlo con la máxima precisión." },
    tool: { uploadFiles: "Subir archivos", examples: "Ejemplos", recommendedTools: "Herramientas recomendadas", chooseFile: "Elegir archivo de audio / video", getTranscript: "Obtener transcripción", submitting: "Enviando" }
  },
  de: {
    shell: { home: "Startseite", feedback: "Feedback", pricing: "Preise", signIn: "Anmelden", credits: "Credits", checkIn: "Check-in", buy: "Kaufen", myResources: "Meine Ressourcen", freeUser: "Kostenloser Nutzer", signOut: "Abmelden" },
    hero: { title: "Kostenloser Sprache-zu-Text-Konverter", description: "Lade deine Datei hoch und erhalte eine präzise Transkription." }
  },
  fr: {
    shell: { home: "Accueil", feedback: "Avis", pricing: "Tarifs", signIn: "Se connecter", credits: "Crédits", checkIn: "Check-in", buy: "Acheter", myResources: "Mes ressources", freeUser: "Utilisateur gratuit", signOut: "Se déconnecter" },
    hero: { title: "Convertisseur vocal en texte gratuit", description: "Importez votre fichier pour le transcrire avec précision." }
  },
  it: {
    shell: { home: "Home", feedback: "Feedback", pricing: "Prezzi", signIn: "Accedi", credits: "Crediti", checkIn: "Check-in", buy: "Acquista", myResources: "Le mie risorse", freeUser: "Utente gratuito", signOut: "Esci" },
    hero: { title: "Convertitore gratuito da voce a testo", description: "Carica il tuo file per trascriverlo nel testo più accurato." }
  },
  ja: {
    shell: { home: "ホーム", feedback: "フィードバック", pricing: "料金", signIn: "ログイン", credits: "クレジット", checkIn: "チェックイン", buy: "購入", myResources: "マイリソース", freeUser: "無料ユーザー", signOut: "ログアウト" },
    hero: { title: "無料の音声テキスト変換", description: "ファイルをアップロードして高精度な文字起こしを作成します。" }
  },
  ru: {
    shell: { home: "Главная", feedback: "Отзывы", pricing: "Цены", signIn: "Войти", credits: "Кредиты", checkIn: "Отметка", buy: "Купить", myResources: "Мои ресурсы", freeUser: "Бесплатный пользователь", signOut: "Выйти" },
    hero: { title: "Бесплатный конвертер речи в текст", description: "Загрузите файл и получите точную расшифровку." }
  },
  pt: {
    shell: { home: "Início", feedback: "Feedback", pricing: "Preços", signIn: "Entrar", credits: "Créditos", checkIn: "Check-in", buy: "Comprar", myResources: "Meus recursos", freeUser: "Usuário gratuito", signOut: "Sair" },
    hero: { title: "Conversor gratuito de fala para texto", description: "Envie seu arquivo para transcrever com alta precisão." }
  },
  br: {
    shell: { home: "Início", feedback: "Feedback", pricing: "Preços", signIn: "Entrar", credits: "Créditos", checkIn: "Check-in", buy: "Comprar", myResources: "Meus recursos", freeUser: "Usuário gratuito", signOut: "Sair" },
    hero: { title: "Conversor gratuito de fala para texto", description: "Envie seu arquivo para transcrever com alta precisão." }
  },
  vi: {
    shell: { home: "Trang chủ", feedback: "Phản hồi", pricing: "Bảng giá", signIn: "Đăng nhập", credits: "Tín dụng", checkIn: "Điểm danh", buy: "Mua", myResources: "Tài nguyên của tôi", freeUser: "Người dùng miễn phí", signOut: "Đăng xuất" },
    hero: { title: "Công cụ chuyển giọng nói thành văn bản miễn phí", description: "Tải tệp lên để chuyển thành văn bản chính xác." }
  },
  id: {
    shell: { home: "Beranda", feedback: "Masukan", pricing: "Harga", signIn: "Masuk", credits: "Kredit", checkIn: "Check-in", buy: "Beli", myResources: "Sumber daya saya", freeUser: "Pengguna gratis", signOut: "Keluar" },
    hero: { title: "Konverter ucapan ke teks gratis", description: "Unggah file untuk mentranskripsikannya secara akurat." }
  },
  hi: {
    shell: { home: "होम", feedback: "फ़ीडबैक", pricing: "मूल्य", signIn: "साइन इन", credits: "क्रेडिट", checkIn: "चेक-इन", buy: "खरीदें", myResources: "मेरे संसाधन", freeUser: "मुफ़्त उपयोगकर्ता", signOut: "साइन आउट" },
    hero: { title: "मुफ़्त स्पीच टू टेक्स्ट कन्वर्टर", description: "अपनी फ़ाइल अपलोड करें और सटीक टेक्स्ट पाएं।" }
  },
  ar: {
    shell: { home: "الرئيسية", feedback: "ملاحظات", pricing: "الأسعار", signIn: "تسجيل الدخول", credits: "أرصدة", checkIn: "تسجيل يومي", buy: "شراء", myResources: "مواردي", freeUser: "مستخدم مجاني", signOut: "تسجيل الخروج" },
    hero: { title: "محول الكلام إلى نص مجاناً", description: "ارفع ملفك لتحويله إلى نص بدقة عالية." }
  },
  bn: {
    shell: { home: "হোম", feedback: "প্রতিক্রিয়া", pricing: "মূল্য", signIn: "সাইন ইন", credits: "ক্রেডিট", checkIn: "চেক-ইন", buy: "কিনুন", myResources: "আমার রিসোর্স", freeUser: "ফ্রি ব্যবহারকারী", signOut: "সাইন আউট" },
    hero: { title: "ফ্রি স্পিচ টু টেক্সট কনভার্টার", description: "আপনার ফাইল আপলোড করে নির্ভুল টেক্সটে রূপান্তর করুন।" }
  },
  ur: {
    shell: { home: "ہوم", feedback: "فیڈبیک", pricing: "قیمتیں", signIn: "سائن ان", credits: "کریڈٹس", checkIn: "چیک اِن", buy: "خریدیں", myResources: "میرے وسائل", freeUser: "مفت صارف", signOut: "سائن آؤٹ" },
    hero: { title: "مفت اسپیچ ٹو ٹیکسٹ کنورٹر", description: "اپنی فائل اپ لوڈ کریں اور درست متن حاصل کریں۔" }
  }
};

function deepMerge<T extends Record<string, unknown>>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const output = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    const current = output[key];
    if (
      value &&
      current &&
      typeof value === "object" &&
      typeof current === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(current)
    ) {
      output[key] = deepMerge(current as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }
  return output as T;
}

export const dictionaries: Record<Locale, PublicText> = Object.fromEntries(
  locales.map((locale) => [locale, deepMerge(en, overrides[locale] as DeepPartial<PublicText> | undefined)])
) as Record<Locale, PublicText>;

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function normalizeLocale(locale: string): Locale | null {
  const normalized = locale.toLowerCase();
  if (normalized === "zh-cn") return "zh-cn";
  if (normalized === "zh-tw") return "zh-tw";
  if (normalized === "pt-br") return "br";
  if (isLocale(normalized)) return normalized;
  return null;
}

export function matchLocale(acceptLanguage: string) {
  const requested = acceptLanguage
    .split(",")
    .map((item) => item.trim().split(";")[0])
    .filter(Boolean);

  for (const item of requested) {
    const normalized = normalizeLocale(item);
    if (normalized) return normalized;
    const base = item.split("-")[0];
    const match = locales.find((locale) => locale === base.toLowerCase());
    if (match) return match;
    if (base === "pt" && item.toLowerCase().includes("br")) return "br";
    if (base === "zh") return item.toLowerCase().includes("tw") || item.toLowerCase().includes("hk") ? "zh-tw" : "zh-cn";
  }

  return defaultLocale;
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function dateLocale(locale: Locale) {
  if (locale === "zh-cn") return "zh-CN";
  if (locale === "zh-tw") return "zh-TW";
  if (locale === "br") return "pt-BR";
  return locale;
}

export function isChineseLocale(locale: Locale) {
  return locale === "zh-cn" || locale === "zh-tw";
}

export function buildMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const canonical = `${siteUrl}${localizedPath(locale)}`;

  return {
    metadataBase: new URL(siteUrl),
    title: dict.meta.title,
    description: dict.meta.description,
    keywords: [...dict.meta.keywords],
    alternates: {
      canonical,
      languages: languageAlternates
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "DeVoice",
      title: dict.meta.title,
      description: dict.meta.description,
      locale
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1
      }
    }
  };
}
