import { BadgeCheck, Brain, FileAudio, Headphones, MicVocal, Music2, PlayCircle, Sparkles, Star, UploadCloud, Video, Youtube } from "lucide-react";
import Image from "next/image";
import { DeVoiceExamples } from "@/components/devoice-examples";
import { DeVoiceFooter } from "@/components/devoice-footer";
import { NoiseUploadClient } from "@/components/noise-upload-client";
import { PromptGenerationPanel } from "@/components/devoice-prompt-panel";
import { DeVoiceVoicePanel } from "@/components/devoice-voice-panel";
import { JobForm } from "@/components/job-form";
import { ToolFeatureCarousel } from "@/components/tool-feature-carousel";
import { getDictionary, localizedPath, type Locale } from "@/lib/i18n";
import type { DeVoiceJobType } from "@/types/devoice-job";

export type DeVoiceToolSlug =
  | "home"
  | "audio-to-text"
  | "video-to-text"
  | "ai-speech-to-text"
  | "remove-background-noise"
  | "ai-noise-filter"
  | "text-to-speech"
  | "ai-voice-generator"
  | "ai-dubbing"
  | "ai-voice-actors"
  | "ai-voice-cloning"
  | "ai-voice-enhancer-isolate"
  | "ai-voice-changer"
  | "ai-music-generator"
  | "ai-rap-generator"
  | "ai-rap-lyrics-generator"
  | "audio-extract-from-video"
  | "transcribe-youtube-videos"
  | "youtube-transcript-generator"
  | "youtube-subtitle-downloader"
  | "youtube-video-summarizer";

type ToolConfig = {
  slug: DeVoiceToolSlug;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  kind: "upload" | "youtube" | "noise" | "voice-enhance" | "voice-change" | "speech" | "dubbing" | "music" | "rap" | "lyrics" | "clone" | "audio-extract";
  featureEyebrow: string;
  featureTitle: string;
  guideTitle: string;
  guideIntro: string;
  guide: Array<[string, string, string]>;
  useCases: Array<[string, string, string]>;
  why: Array<[string, string]>;
  whyTitle: string;
  whyLead?: string;
  faqTitle: string;
  cta: string;
  ctaTitle?: string;
  ctaBody?: string;
  ctaButton?: string;
  sectionOrder?: "benefits-first" | "guide-first" | "why-first";
  featureKicker?: string;
  guideKicker?: string;
  testimonialTitle?: string;
  testimonialKicker?: string;
  testimonials?: Array<[string, string]>;
  compactToolPage?: boolean;
  inlineGuideStepLabel?: boolean;
  hideGenericDiscoverySections?: boolean;
  dedicatedUploadPanel?: boolean;
  customContentOrder?: "ai-noise-filter" | "remove-background-noise";
  customUseCaseTitle?: string;
  transcriberSectionOrder?: "benefits-guide-why" | "benefits-why-guide";
};

const baseWhy: Array<[string, string]> = [
  ["Advanced AI Processing", "Accurate speech, clean structure and fast online results for everyday media workflows."],
  ["Multi-Language Support", "Work with global audio, video and YouTube content across popular languages."],
  ["No Software Required", "Everything happens in the browser with a simple upload, paste or generate flow."],
  ["Privacy-Focused Workflow", "Uploaded files are encrypted, processed securely, and kept in your private DeVoice account."]
];

export const toolConfigs: Record<DeVoiceToolSlug, ToolConfig> = {
  home: {
    slug: "home",
    title: "Free Speech to Text Converter",
    description: "Upload your document to transcribe it into the most accurate text.",
    kind: "upload",
    featureEyebrow: "AI Transcription Tools",
    featureTitle: "Real-World Benefits of AI Speech to Text",
    guideTitle: "How to Convert Speech to Text Online?",
    guideIntro: "Upload your file, let AI process the speech, and get accurate transcripts instantly.",
    guide: [
      ["01", "Upload Your Audio or Video File", "Upload recordings, meetings, podcasts, interviews or videos in MP3, WAV, M4A, MP4, MOV and more."],
      ["02", "Convert Speech to Text with AI", "DeVoice automatically detects speech, supports multiple speakers and turns audio into structured text."],
      ["03", "Download or Edit Your Transcript", "Copy, edit or export text for subtitles, notes, articles and searchable records."]
    ],
    useCases: [
      ["Meeting Notes Without Manual Typing", "Meeting Notes", "Turn calls into organized notes, decisions and action items without replaying recordings multiple times."],
      ["Faster Content Repurposing for Creators", "Content Repurposing", "Transform podcasts, interviews and videos into blog posts, subtitles, newsletters and social captions."],
      ["Better Accessibility for Video and Audio Content", "Accessibility", "Make tutorials, webinars, lectures and online videos easier to search, read and access."]
    ],
    why: [
      ["Accurate AI Speech Recognition", "Convert speech to text with high accuracy, including accents, fast speech and background noise."],
      ["Fast Online Transcription", "Transcribe audio and video into editable text within seconds. No software installation required."],
      ["Supports Audio & Video Files", "Upload MP3, WAV, M4A, MP4, MOV, WEBM and more."],
      ["Multi-Language Speech to Text", "Convert speech to text in 50+ languages including English, Spanish, French, German, Japanese and Chinese."],
      ["Secure & Private Processing", "Uploaded files are encrypted and handled carefully to protect your privacy."]
    ],
    whyTitle: "Why Choose DeVoice Speech to Text Converter?",
    faqTitle: "About DeVoice You Should Know",
    cta: "Convert Speech to Text Now",
    ctaTitle: "Convert Speech to Text Online Today",
    ctaBody: "Start using DeVoice to transcribe audio and video into accurate text with fast AI-powered speech recognition."
  },
  "audio-to-text": {
    slug: "audio-to-text",
    title: "Free AI Audio to Text Converter",
    seoTitle: "Audio to Text Converter – Free AI Audio Transcription",
    seoDescription: "Convert audio to text instantly with our free AI Audio to Text Converter. Transcribe MP3, WAV, and video files into accurate text online.",
    description:
      "Upload your audio or video files and use our Audio to Text Converter to generate accurate, editable transcripts in seconds.",
    kind: "upload",
    featureEyebrow: "Audio to Text Features",
    featureTitle: "Who Needs Our Audio to Text Converter?",
    guideTitle: "How to Convert Audio to Text in Seconds?",
    guideIntro: "Turning audio into text has never been easier. With our AI-powered Audio to Text Converter, you can transcribe audio files in just a few clicks.",
    guide: [
      ["01", "Upload your audio or video file", "Start by uploading your audio or video file. DeVoice supports common formats and makes it easy to convert audio file to text online without extra tools."],
      ["02", "Let AI convert audio to text", "Click Convert and let our AI instantly convert audio to text. The system automatically detects speech, removes fillers, and structures your transcript for readability."],
      ["03", "Download or copy your text instantly", "Once processing is complete, download your transcript instantly. This free audio to text converter lets you save, edit, or reuse your text however you need."]
    ],
    useCases: [
      ["Convert Audio to Text for Podcasts", "Convert Audio to Text for Podcasts", "Podcasters and journalists can transcribe podcast episodes, interviews, and voice recordings into clean, editable text in seconds instead of spending hours typing manually."],
      ["Convert Meeting Audio to Text", "Convert Meeting Audio to Text", "Convert meeting recordings, team calls, and business conversations into structured text so decisions, action items, and insights are easy to review, share, and archive."],
      ["Convert Audio to Text for Content Creation", "Convert Audio to Text for Content Creation", "Turn spoken content from YouTube videos, tutorials, live streams, and recordings into blogs, captions, and social media posts for faster repurposing."]
    ],
    why: [
      ["Advanced Speech Recognition", "Our AI-powered Audio to Text Converter uses deep learning to transcribe audio to text with high accuracy. It handles accents, jargon, and complex speech."],
      ["Multi-Language Support", "This Audio to Text Converter supports 50+ languages, helping global teams convert audio to text online across English, Spanish, French, German, Chinese, and more."],
      ["Speaker Identification", "Easily transcribe audio to text with multiple speakers. The system detects and labels voices automatically, improving transcript clarity."],
      ["Noise-Resistant AI Engine", "Even with background noise, DeVoice enhances voice clarity and delivers accurate audio to text transcription for real-world recordings."],
      ["Fast Processing & Instant Output", "Convert files in seconds using the fast Audio to Text Converter, from MP3 to text to full audio transcription online."],
      ["Privacy and Data Security", "Uploaded files are protected with secure processing so you can convert audio to text online without worrying about privacy risks."]
    ],
    whyTitle: "Why Choose Our Audio to Text Converter?",
    faqTitle: "FAQ",
    cta: "Convert Audio to Text Now",
    ctaTitle: "Convert Audio to Text Online Today",
    ctaBody: "Start using DeVoice to convert audio files into accurate text.",
    sectionOrder: "guide-first",
    compactToolPage: true,
    dedicatedUploadPanel: true
  },
  "video-to-text": {
    slug: "video-to-text",
    title: "Free AI Video to Text Converter",
    seoTitle: "Video to Text Converter - Transcribe Video to Text Online",
    seoDescription: "Transcribe video to text instantly with our free Video to Text Converter. Convert video to text online from MP4, MOV, and more.",
    description:
      "Upload your video files and use our Video to Text Converter to transcribe video to text instantly with accurate, editable transcripts.",
    kind: "upload",
    featureEyebrow: "Video to Text Features",
    featureTitle: "Who Needs Our Video to Text Converter?",
    guideTitle: "How to Transcribe Video to Text in Seconds?",
    guideIntro: "Transcribing video to text has never been easier. With our AI-powered Video to Text Converter, you can convert video to text online in just a few steps.",
    guide: [
      ["01", "Upload your video file", "Start by uploading your video file. Our Video to Text Converter supports formats like MP4 and MOV, making it easy to transcribe video to text without extra tools."],
      ["02", "Let AI transcribe video to text", "Click Convert and let AI instantly transcribe video to text. The system detects speech, removes filler words, and structures your transcript clearly."],
      ["03", "Download or copy your text instantly", "Once finished, download your transcript or copy it instantly. This transcribe video to text free tool lets you edit and reuse content easily."]
    ],
    useCases: [
      ["Convert Video to Text for YouTube Content", "Convert Video to Text for YouTube Content", "Convert videos into SEO-friendly articles, subtitles, summaries, and social posts without manual transcription."],
      ["Transcribe Video to Text for Meetings", "Transcribe Video to Text for Meetings", "Turn recorded meetings and webinars into structured, searchable documents for decisions, action points, and team review."],
      ["Convert Video to Text for Content Repurposing", "Convert Video to Text for Content Repurposing", "Reuse tutorials, live streams, and videos for blogs, emails, and social media so content teams can scale production faster."]
    ],
    why: [
      ["Advanced AI Video Transcription", "Our Video to Text Converter uses advanced AI to transcribe video to text with high accuracy across different accents, tones, and speaking styles."],
      ["Multi-Language Support", "This tool supports 50+ languages, allowing users to transcribe video to text globally and convert video to text online across languages."],
      ["Speaker Detection", "Automatically identify speakers when you transcribe video to text, making transcripts clearer and easier to follow."],
      ["Noise-Resistant Processing", "Even noisy videos can be processed accurately. DeVoice enhances audio and ensures clean video to text transcription."],
      ["Fast Processing & Instant Results", "Convert videos in seconds using the fast Video to Text Converter, ideal for quick transcribe video to text free results."],
      ["Secure & Private", "Files are processed securely so you can safely transcribe video to text online with privacy protection."]
    ],
    whyTitle: "Why Choose Our Video to Text Converter?",
    faqTitle: "FAQ",
    cta: "Transcribe Video to Text Now",
    ctaTitle: "Transcribe Video to Text Online Today",
    ctaBody: "Turn spoken video content into subtitles, notes and searchable text.",
    sectionOrder: "guide-first",
    compactToolPage: true,
    dedicatedUploadPanel: true
  },
  "ai-speech-to-text": {
    slug: "ai-speech-to-text",
    title: "Free Speech to Text Converter",
    seoTitle: "DeVoice | Free Speech to Text Converter & AI Transcription",
    seoDescription: "Convert Speech to text instantly with DeVoice AI. Fast, accurate speech to text transcription online for podcasts, meetings, interviews, and videos.",
    description: "Upload your document to transcribe it into the most accurate text.",
    kind: "upload",
    featureEyebrow: "AI Transcription Tools",
    featureTitle: "Real-World Benefits of AI Speech to Text",
    guideTitle: "How to Convert Speech to Text Online?",
    guideIntro: "Upload your file, let AI process the speech, and get accurate transcripts instantly.",
    guide: [
      ["01", "Upload Your Audio or Video File", "Upload recordings, meetings, podcasts, interviews or videos in MP3, WAV, M4A, MP4, MOV and more."],
      ["02", "Convert Speech to Text with AI", "DeVoice automatically detects speech, supports multiple speakers and turns audio into structured text."],
      ["03", "Download or Edit Your Transcript", "Copy, edit or export text for subtitles, notes, articles and searchable records."]
    ],
    useCases: [
      ["Meeting Notes Without Manual Typing", "Meeting Notes", "Turn calls into organized notes, decisions and action items without replaying recordings multiple times."],
      ["Faster Content Repurposing for Creators", "Content Repurposing", "Transform podcasts, interviews and videos into blog posts, subtitles, newsletters and social captions."],
      ["Better Accessibility for Video and Audio Content", "Accessibility", "Make tutorials, webinars, lectures and online videos easier to search, read and access."]
    ],
    why: baseWhy,
    whyTitle: "Why Choose DeVoice Speech to Text Converter?",
    faqTitle: "About DeVoice You Should Know",
    cta: "Convert Speech to Text Now",
    ctaTitle: "Convert Speech to Text Online Today",
    ctaBody: "Start using DeVoice to transcribe audio and video into accurate text with fast AI-powered speech recognition.",
    compactToolPage: true,
    transcriberSectionOrder: "benefits-why-guide"
  },
  "remove-background-noise": {
    slug: "remove-background-noise",
    title: "Remove Background Noise from Audio",
    description: "Remove background noise from audio online free, directly in your browser.",
    seoTitle: "Remove Noise from Audio Online Free | DeVoice",
    seoDescription: "Whether you're cleaning up voice recordings or enhancing audio quality for video, DeVoice lets you easily remove noise from audio online free.",
    kind: "noise",
    featureEyebrow: "Our Features",
    featureTitle: "AI-Powered to Remove Noise from Audio Effortlessly",
    guideTitle: "How to Remove Background Noise from Audio online free",
    guideIntro: "Remove background noise from audio online free in three simple steps.",
    guide: [
      ["Step 1", "Step 1: Upload Your Audio or Video File", "Upload your audio or video file. DeVoice supports removing background noise from audio online free recordings in MP3, WAV, MP4, and other formats."],
      ["Step 2", "Step 2: AI Noise Reduction Processing", "Once uploaded, AI automatically detects unwanted background sounds and processes your file. The system focuses on speech enhancement without manual adjustments."],
      ["Step 3", "Step 3: Preview and Download Clean Audio", "Preview the cleaned result, compare it with the original, and download your improved audio in minutes without sacrificing quality."]
    ],
    useCases: [
      ["Remove Background Noise from Audio for Studio-Quality Voice Recordings", "Interviews", "Podcasts and interviews often suffer from hissing, electrical hum, traffic, or air conditioning. DeVoice isolates voices and reduces unwanted sounds automatically for clean, natural speech."],
      ["Remove Background Noise for Clear and Focused Communication", "Meetings", "Online classes, webinars, and virtual meetings need clear audio. Remove keyboard typing, household sounds, street noise, or office chatter so teams communicate more professionally."],
      ["Remove Background Noise from Video Audio for Cleaner Content", "Vlogs", "Vlogs and social videos are often recorded around wind, traffic, and ambient noise. DeVoice cleans video audio even when footage is shot without external microphones."],
      ["Remove Background Noise from Recordings Without Losing Quality", "Audio Production", "For musicians and audio creators, DeVoice detects hiss, static, and white noise while preserving the depth of vocals and instruments for demos, vocal tracks, and music projects."]
    ],
    why: [
      ["One-Click Remove Noise from Audio", "Remove background noise from audio online with a single click. DeVoice uses AI to detect and eliminate unwanted sounds automatically, helping you clean recordings without manual adjustments or complex tools."],
      ["No Editing Skills Required", "You do not need audio engineering experience to get great results. Upload your file, and DeVoice removes background noise so anyone can improve sound quality on the first try."],
      ["Fast AI Processing: Remove Noise from Audio", "Forget long editing sessions. AI processes your audio in seconds, allowing you to remove noise from audio online free and focus on creating content instead of fixing technical issues."],
      ["Studio-Level Sound, Zero Complexity", "From podcasts and videos to meetings and voice recordings, DeVoice delivers clear, professional-quality audio that feels polished and natural without studio equipment."]
    ],
    whyTitle: "AI-Powered to Remove Noise from Audio Effortlessly",
    faqTitle: "FAQ",
    cta: "Upload Your Audio to Remove Noise",
    ctaTitle: "Remove Noise from Audio Online Free and Effortless",
    ctaBody: "Eliminate background noise instantly with AI, no skills required.",
    customUseCaseTitle: "Designed for Anyone Who Needs to Remove Background Noise from Audio",
    featureKicker: "Use Cases",
    guideKicker: "Tutorial",
    compactToolPage: true,
    customContentOrder: "remove-background-noise"
  },
  "ai-noise-filter": {
    slug: "ai-noise-filter",
    title: "Extract Clear Voicefrom Audio and Video",
    description: "DeVoice is a free, web-based AI noise filter that uses cutting-edge artificial intelligence to remove background noise from your audio. DeVoice delivers professional-grade results with just one click.",
    seoTitle: "Free AI Noise Filter – Remove Vocals & Background Noise",
    seoDescription: "Remove background sounds instantly with DeVoice – the best free AI noise filter online. Clean your audio in seconds using advanced AI technology.",
    kind: "noise",
    featureEyebrow: "Our Features",
    featureTitle: "Get Rid of Background Noise Instantly with DeVoice",
    guideTitle: "Step by Step Guide About How to Remove Noise",
    guideIntro: "Remove noise in three simple steps with DeVoice's online AI noise filter.",
    guide: [
      ["Step 1", "Step 1. Upload Your File", "Select the audio or video file you wish to process and upload it to our platform. A single click starts the process to remove background noise."],
      ["Step 2", "Step 2. AI Processing", "Sit back as our AI analyzes your file and automatically removes background noise. In just a few seconds, your audio is transformed."],
      ["Step 3", "Step 3. Preview & Download", "Review the cleaned audio tracks, choose your preferred version, and download your high-quality file with background noise removed."]
    ],
    useCases: [
      ["Get Rid of Background Noise Instantly with DeVoice", "Original Audio", "With DeVoice's online AI noise filter, you can remove background noise from your audio or video in seconds - no complex tools or editing skills needed. Experience studio-quality clarity with just one upload."],
      ["Musicians and Sound Engineers", "Musicians", "Whether remixing, mastering, or sampling, musicians and audio engineers can use DeVoice to isolate vocals or remove background noise from recordings. DeVoice is the go-to AI noise filter for professional-grade sound without complex tools."],
      ["Video Creators and Bloggers", "Creators", "Content creators often deal with noisy environments. From wind noise to urban traffic, DeVoice helps video bloggers and influencers clean up voiceovers and field recordings with ease."],
      ["Podcast Editors and Educators", "Editors", "Podcast editors, educators, and course creators can clean speech recordings quickly so lessons, interviews, and published episodes stay clear and easy to follow."]
    ],
    why: [
      ["Efficient Processing", "DeVoice processes files within seconds, ensuring fast, smooth, and reliable performance every time. With AI noise filter technology, your files are cleaned in record time."],
      ["Cross-Platform Support", "DeVoice works across all modern browsers, whether on desktop, laptop, or mobile devices. The AI noise filter runs entirely online."],
      ["In-House AI Technology", "DeVoice uses purpose-built AI technology to detect unwanted sounds and preserve the main voice or track."],
      ["Free to Use", "Start cleaning audio online with DeVoice's AI noise filter without complex software or editing skills."]
    ],
    whyTitle: "Get the Best Results with Our AI Noise Filter",
    faqTitle: "FAQ",
    cta: "Start for Free Today!",
    ctaTitle: "Experience the Next Generation of AI Noise Filter Now！",
    ctaBody: "",
    sectionOrder: "guide-first",
    guideKicker: "Tutorial",
    featureKicker: "Our Features",
    compactToolPage: true,
    customContentOrder: "ai-noise-filter"
  },
  "text-to-speech": {
    slug: "text-to-speech",
    title: "Free Text to Speech Online AI",
    description: "Please enter the text you want to convert into natural tone.",
    seoTitle: "Free Text To Speech Online with Natural AI Voices | Devoice",
    seoDescription: "Convert text to speech with 100+ AI voices for free, capturing every nuance & subtlety of human speech.It also supports custom cloning of any sound.",
    kind: "speech",
    featureEyebrow: "Key Features",
    featureTitle: "Top Text to Speech Use Cases You Can’t Miss",
    guideTitle: "How to Convert Text to Speech with Devoice in 3 Easy Steps",
    guideIntro: "Convert your text to natural speech in 3 simple steps:",
    guide: [
      ["Step 1", "Step 1: Paste or Type Your Text", "Enter any written content you want to convert, whether it's an article, script, or notes. This is where text in to speech begins."],
      ["Step 2", "Step 2: Choose Voice and Settings", "Choose your preferred AI tone; our engine also supports custom tones for greater flexibility."],
      ["Step 3", "Step 3: Generate, Play, or Download Audio", "Listen online or export your result using text to speech download options for MP3. You can also reuse output for videos, podcasts, or presentations."]
    ],
    useCases: [
      ["Crank Up Your Creator Content in Minutes", "Content Creation", "Level up your podcasts, reels and YouTube content by leveraging text to speech to turn scripts into natural, expressive voiceovers in minutes — no recording equipment or voice actors needed. This handy text-to-speech solution is a game-changer for creators chasing tight deadlines without sacrificing audio quality."],
      ["Make Audiobook Production Way More Efficient", "Audiobook Production", "Make audiobook creation faster when you use text to speech to convert novels, short stories and manuscripts into natural-sounding audio content. Pair it with intuitive text to speech tools, and creators cut down recording time drastically."],
      ["Amplify Your Marketing Campaign Results", "Marketing Boost", "Boost engagement for your campaigns when you harness text to speech to generate catchy voiceovers for ads, social media clips and product demos that match your brand tone. Turn copy into persuasive audio in seconds, and capture your audience's attention faster than ever with this versatile tool."],
      ["Streamline Your Daily Tasks Effortlessly", "Daily Efficiency", "Simplify your daily tasks by using text to speech to turn long emails, articles or e-books into listenable audio — perfect for commutes, workouts or multitasking. No complicated tools required, just quick, clear voice output that makes text to speech a must-have for maximizing your everyday efficiency."]
    ],
    why: [
      ["Clone or Design a Voice", "Instantly replicate your own voice or craft unique AI voices with full control."],
      ["Multilingual Speech", "Bring stories to life in over 100 languages with native-level emotion and clarity."],
      ["Free Text to Speech Online Converter", "No subscriptions, no hidden limits - just convert and listen instantly."],
      ["100% Online - No Software Required", "Use the text to speech online tool directly in your browser."],
      ["Fast Audio Generation", "Convert long articles or short scripts in seconds, not minutes."],
      ["Works on All Devices", "Android, iPhone, Windows and macOS - DeVoice works everywhere."]
    ],
    whyTitle: "Why Use Devoice’s Text to Speech Tool?",
    whyLead:
      "Devoice serves creators, educators, marketers and everyday users with the best text to speech AI tools — get realistic voices without complicated setups or steep costs, all natural and expressive.",
    faqTitle: "Frequently Asked Questions – Text to Speech",
    cta: "Generate",
    ctaTitle: "Convert Text to Speech Instantly",
    ctaBody: "Bring your words to life with Devoice’s AI-powered text to speech tool.",
    ctaButton: "start converting now →",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Features",
    compactToolPage: true,
    inlineGuideStepLabel: true
  },
  "ai-voice-generator": {
    slug: "ai-voice-generator",
    title: "Free Text to Speech Online AI",
    description: "Please enter the text you want to convert into natural tone.",
    seoTitle: "Free Text To Speech Online with Natural AI Voices | Devoice",
    seoDescription: "Convert text to speech with 100+ AI voices for free, capturing every nuance & subtlety of human speech.It also supports custom cloning of any sound.",
    kind: "speech",
    featureEyebrow: "Key Features",
    featureTitle: "Top Text to Speech Use Cases You Can’t Miss",
    guideTitle: "How to Convert Text to Speech with Devoice in 3 Easy Steps",
    guideIntro: "Convert your text to natural speech in 3 simple steps:",
    guide: [
      ["Step 1", "Step 1: Paste or Type Your Text", "Enter any written content you want to convert, whether it's an article, script, or notes. This is where text in to speech begins."],
      ["Step 2", "Step 2: Choose Voice and Settings", "Choose your preferred AI tone; our engine also supports custom tones for greater flexibility."],
      ["Step 3", "Step 3: Generate, Play, or Download Audio", "Listen online or export your result using text to speech download options for MP3. You can also reuse output for videos, podcasts, or presentations."]
    ],
    useCases: [
      ["Crank Up Your Creator Content in Minutes", "Content Creation", "Level up podcasts, reels and YouTube content by leveraging text to speech to turn scripts into natural, expressive voiceovers in minutes without recording equipment or voice actors."],
      ["Make Audiobook Production Way More Efficient", "Audiobook Production", "Make audiobook creation faster when you use text to speech to convert novels, short stories and manuscripts into natural-sounding audio content."],
      ["Amplify Your Marketing Campaign Results", "Marketing Boost", "Generate catchy voiceovers for ads, social media clips and product demos that match your brand tone, then turn copy into persuasive audio in seconds."],
      ["Streamline Your Daily Tasks Effortlessly", "Daily Efficiency", "Simplify daily tasks by using text to speech to turn long emails, articles or e-books into listenable audio for commutes, workouts or multitasking."]
    ],
    why: [
      ["Clone or Design a Voice", "Instantly replicate your own voice or craft unique AI voices with full control."],
      ["Multilingual Speech", "Bring stories to life in over 100 languages with native-level emotion and clarity."],
      ["Free AI Voice Generator", "No subscriptions, no hidden limits - just convert and listen instantly."],
      ["100% Online - No Software Required", "Use the text to speech online tool directly in your browser."],
      ["Fast Audio Generation", "Convert long articles or short scripts in seconds, not minutes."],
      ["Works on All Devices", "Android, iPhone, Windows and macOS - DeVoice works everywhere."]
    ],
    whyTitle: "Why Use Devoice’s Text to Speech Tool?",
    whyLead:
      "Devoice serves creators, educators, marketers and everyday users with the best text to speech AI tools — get realistic voices without complicated setups or steep costs, all natural and expressive.",
    faqTitle: "Frequently Asked Questions – Text to Speech",
    cta: "Generate",
    ctaTitle: "Convert Text to Speech Instantly",
    ctaBody: "Bring your words to life with Devoice’s AI-powered text to speech tool.",
    ctaButton: "start converting now →",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Features",
    compactToolPage: true,
    inlineGuideStepLabel: true
  },
  "ai-voice-actors": {
    slug: "ai-voice-actors",
    title: "Free Text to Speech Online AI",
    description: "Please enter the text you want to convert into natural tone.",
    seoTitle: "Free Text To Speech Online with Natural AI Voices | Devoice",
    seoDescription: "Convert text to speech with 100+ AI voices for free, capturing every nuance & subtlety of human speech.It also supports custom cloning of any sound.",
    kind: "speech",
    featureEyebrow: "Key Features",
    featureTitle: "Top Text to Speech Use Cases You Can’t Miss",
    guideTitle: "How to Convert Text to Speech with Devoice in 3 Easy Steps",
    guideIntro: "Convert your text to natural speech in 3 simple steps:",
    guide: [
      ["Step 1", "Step 1: Paste or Type Your Text", "Enter any written content you want to convert, whether it's an article, script, or notes. This is where text in to speech begins."],
      ["Step 2", "Step 2: Choose Voice and Settings", "Choose your preferred AI tone; our engine also supports custom tones for greater flexibility."],
      ["Step 3", "Step 3: Generate, Play, or Download Audio", "Listen online or export your result using text to speech download options for MP3. You can also reuse output for videos, podcasts, or presentations."]
    ],
    useCases: [
      ["Crank Up Your Creator Content in Minutes", "Content Creation", "Level up podcasts, reels and YouTube content by leveraging text to speech to turn scripts into natural, expressive voiceovers in minutes without recording equipment or voice actors."],
      ["Make Audiobook Production Way More Efficient", "Audiobook Production", "Make audiobook creation faster when you use text to speech to convert novels, short stories and manuscripts into natural-sounding audio content."],
      ["Amplify Your Marketing Campaign Results", "Marketing Boost", "Generate catchy voiceovers for ads, social media clips and product demos that match your brand tone, then turn copy into persuasive audio in seconds."],
      ["Streamline Your Daily Tasks Effortlessly", "Daily Efficiency", "Simplify daily tasks by using text to speech to turn long emails, articles or e-books into listenable audio for commutes, workouts or multitasking."]
    ],
    why: [
      ["Clone or Design a Voice", "Instantly replicate your own voice or craft unique AI voices with full control."],
      ["Multilingual Speech", "Bring stories to life in over 100 languages with native-level emotion and clarity."],
      ["Free Text to Speech Online Converter", "No subscriptions, no hidden limits - just convert and listen instantly."],
      ["100% Online - No Software Required", "Use the text to speech online tool directly in your browser."],
      ["Fast Audio Generation", "Convert long articles or short scripts in seconds, not minutes."],
      ["Works on All Devices", "Android, iPhone, Windows and macOS - DeVoice works everywhere."]
    ],
    whyTitle: "Why Use Devoice’s Text to Speech Tool?",
    whyLead:
      "Devoice serves creators, educators, marketers and everyday users with the best text to speech AI tools — get realistic voices without complicated setups or steep costs, all natural and expressive.",
    faqTitle: "Frequently Asked Questions – Text to Speech",
    cta: "Generate",
    ctaTitle: "Convert Text to Speech Instantly",
    ctaBody: "Bring your words to life with Devoice’s AI-powered text to speech tool.",
    ctaButton: "start converting now →",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Features",
    compactToolPage: true,
    inlineGuideStepLabel: true
  },
  "ai-dubbing": {
    slug: "ai-dubbing",
    title: "Free Video & Audio Dubbing AI: Localize Videos in 100+ Languages",
    seoTitle: "AI Dubbing Online for Fast, Natural Voiceovers | DeVoice",
    seoDescription: "Use Dubbing AI to generate natural-sounding voiceovers from text in seconds. Upload your own voice or choose preset AI voices.",
    description: "Whether you're localizing videos, narrating content, or building scalable audio workflows, DeVoice Dubbing AI helps you move faster with clean, natural results.",
    kind: "dubbing",
    featureEyebrow: "Key Benefits",
    featureTitle: "You're Underusing Dubbing AI—Unlock Its Core Capabilities Now",
    guideTitle: "How to use Dubbing AI with DeVoice in 3 Easy Steps",
    guideIntro: "Create professional voiceovers in just a few steps:",
    guide: [
      ["Step 1", "Enter Your Text", "Paste or type the script you want to convert into speech."],
      ["Step 2", "Upload a Voice or Choose a Preset", "Upload a reference voice to match a specific tone, or select from high-quality preset AI voices designed for dubbing, narration, and explainer content."],
      ["Step 3", "Generate and Download Audio", "Click generate and let Dubbing AI produce natural, synchronized voice audio."]
    ],
    useCases: [
      ["No Skills Required, Fully Online", "No Skills Required", "Dubbing AI removes the technical barrier of traditional voice production. You don't need recording experience, editing skills, or special software. Simply input text, choose or upload a voice, and generate professional voiceovers directly in your browser."],
      ["Fast and Accurate Voice Generation", "Fast & Accurate", "Advanced speech synthesis delivers clear and natural audio within seconds. Accurately follows your script and maintains proper pacing. Produces consistent results ideal for fast-paced content workflows."],
      ["Support for 100+ Languages and Accents", "100+ Languages", "Dubbing AI supports over 100 languages and regional accents. Easily localize content for global audiences. Generate multilingual voiceovers while keeping pronunciation and tone natural."],
      ["Custom Voice Options for Any Style", "Custom Voices", "Upload your own voice or select from high-quality preset voices. Customize tone, pacing, and style to match different content needs. Perfect for narration, training, marketing, and storytelling."]
    ],
    why: [
      ["Fully Online Dubbing AI", "No downloads or installations. Everything runs in your browser."],
      ["Natural Voice Output", "Advanced speech synthesis delivers smooth pacing, clear pronunciation, and human-like tone."],
      ["Flexible Voice Options", "Upload your own voice or use professionally designed preset voices."],
      ["Fast Generation", "Generate audio in seconds, even for longer scripts."],
      ["Secure Processing", "Your text and audio files are handled securely and never reused without permission."],
      ["Scalable Multi-Language Support", "Generate voiceovers in multiple languages from a single script."]
    ],
    whyTitle: "Why Choose DeVoice for Dubbing AI",
    faqTitle: "Frequently Asked Questions – Dubbing AI",
    cta: "Generate",
    ctaTitle: "Create Voiceovers Faster with Dubbing AI",
    ctaBody: "Turn text into natural speech in seconds with DeVoice.",
    ctaButton: "Try Dubbing AI Online Now",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Benefits",
    compactToolPage: true,
    testimonialTitle: "Trusted by Creators, Teams, and Professionals",
    testimonialKicker: "Testimonials & Reviews",
    testimonials: [
      ["Daniel Morgan – Video Producer", "Dubbing AI helped us localize videos in days instead of weeks. The voices sound surprisingly natural."],
      ["Markus Weber – E-learning Consultant", "Using Dubbing AI removed the need for studio sessions completely."],
      ["Emily Brooks – Startup Founder", "Fast, clean, and easy to use. Exactly what we needed."]
    ]
  },
  "ai-voice-cloning": {
    slug: "ai-voice-cloning",
    title: "Free AI Voice Cloning Online",
    description: "Clone a natural-sounding voice from a short audio sample.",
    seoTitle: "AI Voice Cloning – Clone Any Voice Instantly | DeVoice",
    seoDescription: "Use AI Voice Cloning to replicate real human voices with high accuracy. Upload a sample, enter text, and generate lifelike speech online with DeVoice.",
    kind: "clone",
    featureEyebrow: "Key Benefits",
    featureTitle: "See How AI Voice Cloning Transforms Real Content, Products, and Voices",
    guideTitle: "How to Use AI Voice Cloning with DeVoice in 3 Easy Steps",
    guideIntro: "Create a cloned voice in just a few steps:",
    guide: [
      ["Step 1", "Step 1: Enter Your Text", "Type or paste the script you want the cloned voice to speak."],
      ["Step 2", "Step 2: Upload the Original Voice Sample", "Upload a clear audio recording of the target voice. Even short samples work."],
      ["Step 3", "Step 3: Generate the Voice", "DeVoice analyzes the voice and instantly generates speech that matches the uploaded voice and your text."]
    ],
    useCases: [
      ["Consistent Voice Output Across All Content", "Consistent Voice Output", "- Use AI Voice Cloning to keep the same tone across all audio content\n- Reuse one cloned voice for updates, expansions, and new scripts\n- Avoid voice inconsistency caused by repeated recordings"],
      ["Flexible Script Editing and Fast Regeneration", "Flexible Editing", "- Edit text freely and regenerate audio with AI Voice Cloning\n- Skip re-recording when scripts change or need correction\n- Speed up content updates with instant voice regeneration"],
      ["Studio-Quality Voice Without Studio Setup", "Studio Quality", "- Generate natural speech using AI Voice Cloning without equipment\n- Capture tone, pacing, and expression from a single voice sample\n- Produce clean, professional audio directly online"],
      ["Voice Preservation and Digital Continuity", "Voice Preservation", "- Preserve vocal identity digitally through AI Voice Cloning\n- Continue generating speech when live recording isn't possible\n- Maintain long-term voice consistency across platforms"]
    ],
    why: [
      ["Natural-Sounding Voice Output", "DeVoice uses advanced neural models to ensure AI Voice Cloning sounds smooth, expressive, and human-like — not robotic."],
      ["Simple Online Workflow", "No software downloads or complex setup. DeVoice runs entirely online, from upload to generation."],
      ["Fast Generation Speed", "Generate cloned voice audio in seconds, even for longer text inputs."],
      ["Secure & Privacy-Focused", "All uploaded voice samples are processed securely and handled with care. DeVoice prioritizes user privacy at every step."]
    ],
    whyTitle: "Why Choose DeVoice for AI Voice Cloning",
    faqTitle: "Frequently Asked Questions – AI Voice Cloning",
    cta: "Start Voice Cloning Now",
    ctaTitle: "Create realistic voices without recording again",
    ctaBody: "Experience the power of AI Voice Cloning with DeVoice today.",
    ctaButton: "Start Voice Cloning Now",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Benefits",
    compactToolPage: true,
    inlineGuideStepLabel: true
  },
  "ai-voice-enhancer-isolate": {
    slug: "ai-voice-enhancer-isolate",
    title: "AI Voice Enhancer Isolate - Clear Voice, Preserved Ambience",
    description: "Enhance and isolate any voice with AI in seconds.",
    seoTitle: "AI Voice Enhancer Isolate —Clean, Boost | Devoice",
    seoDescription: "Make your voice stand out with AI Voice Enhancer Isolate. Crystal-clear voice enhancement, no lost background ambience. Ideal for all your audio needs!",
    kind: "voice-enhance",
    featureEyebrow: "Use Cases",
    featureTitle: "All these real-world scenarios use AI Voice Enhancer Isolate.",
    guideTitle: "How to Enhance and Isolate Voice with AI",
    guideIntro: "",
    guide: [
      ["Step 1", "Upload your audio or video file.", "Supports all common formats including MP3, MP4, WAV and more."],
      ["Step 2", "Let the AI voice enhancer isolate the spoken voice automatically.", "The AI works in seconds to separate vocals from background noise and echoes."],
      ["Step 3", "Preview the result and download your clean audio.", "Download the final file with one click, keeping the original quality intact. Fast, simple, and designed for real-world recordings."]
    ],
    useCases: [
      ["Cut Noise, Amplify Your Voice", "Podcasts & Voiceovers", "Use AI Voice Enhancer Isolate to effortlessly isolate vocals from distracting background noise, ambient sounds, or room echoes, producing crisp, professional-quality podcast episodes, voiceovers, and audio narrations. This polished audio elevates content quality and ensures your voice message is front and center for listeners, with no tedious manual editing required."],
      ["No More Muffled Chatter or Keyboard Clicks", "Meetings & Interviews", "Enhance speech clarity and precisely isolate unwanted background distractions from recorded virtual calls, professional interviews, and remote meetings. Cut through keyboard clicks, ambient room noise, and distant chatter to highlight every spoken word clearly, making important conversations easy to follow, review and reference later with total clarity."],
      ["Make Your Voice the Star of Every Clip", "Social Media", "Extract crystal-clear voice audio for all your social media content-including reels, TikTok videos, YouTube shorts, and long-form video uploads-by isolating vocal tracks from background music, environmental sounds or filming noise. Clean, enhanced voice audio boosts audience engagement and ensures your narration, dialogue and commentary stands out in every piece of video content you create."],
      ["Cut Static, Amplify Teacher's Voice", "Education", "Improve the quality of lecture recordings, online lessons and educational audio by isolating the speaker's voice from classroom noise, technical static or background disruptions. Crisp, enhanced vocal clarity makes educational content far easier for students to listen to and comprehend, elevating learning experiences and making study recordings more valuable for review and revision."]
    ],
    why: [
      ["Isolate Voice with Precision", "Devoice is built for creators, professionals, and everyday users who need clean voice audio without complex editing. Our AI isolates speech intelligently, keeping voices natural while removing distractions."],
      ["Enhance Speech Automatically", "Boost volume, balance frequencies, and improve intelligibility with AI voice enhancement."],
      ["Remove Noise Without Manual Editing", "No timelines, filters, or audio skills needed - AI handles everything."],
      ["Works on Any Device", "Desktop, tablet, or mobile - enhance and isolate voice directly in your browser."],
      ["100% Online & Secure", "No downloads, no software, and no file storage after processing."],
      ["Fast One-Click Processing", "Enhance and isolate voice audio in seconds, no waiting for lengthy renders."]
    ],
    whyTitle: "Why Use DeVoice’s AI Voice Enhancer Isolate Tool?",
    faqTitle: "FAQ",
    cta: "Start Enhancing Voice Now →",
    ctaTitle: "Enhance Your Voice Instantly",
    ctaBody: "Get clean, professional-quality vocals without editing skills. Try DeVoice's AI voice enhancer isolate tool and transform your audio in seconds.",
    sectionOrder: "why-first",
    guideKicker: "Tutorial",
    featureKicker: "Use Cases",
    compactToolPage: true
  },
  "ai-voice-changer": {
    slug: "ai-voice-changer",
    title: "#1 Free AI Voice Changer Online",
    description: "Change Your Voice into Any Style Instantly with AI.",
    seoTitle: "Free AI Voice Changer Online | DeVoice",
    seoDescription: "Change your voice instantly with DeVoice AI Voice Changer. Access multiple voice styles with natural, human-like results. Fast, realistic, & free.",
    kind: "voice-change",
    featureEyebrow: "Key Features",
    featureTitle: "AI Voice Changer Built for Real-Time & Recorded Audio",
    guideTitle: "How to Use the AI Voice Changer in 3 Easy Steps",
    guideIntro: "Change your voice in 3 simple steps:",
    guide: [
      ["Step 1", "Upload or Record Your Voice", "Upload an audio file or record your voice directly in the AI voice changer. DeVoice supports common audio formats and works seamlessly for short clips or long-form recordings."],
      ["Step 2", "Choose a Voice Style", "Select from a wide range of AI voice changer effects - including male, female, cartoon, deep voice, high-pitched, and character-style voices. Preview voice styles before applying them."],
      ["Step 3", "Change & Download", "Click 'Generate' and instantly receive your AI voice-changed audio. Download high-quality MP3 or WAV files and use them in videos, streams, podcasts, or social media."]
    ],
    useCases: [
      ["Simple, Creator-Friendly Voice Changer", "Simple Workflow", "DeVoice is built for speed and simplicity. Upload your audio, choose a voice, and let the AI voice changer transform your sound in seconds. Perfect for creators who need fast results without technical setup."],
      ["Free & Cost-Effective AI Voice Changer", "Free & Cost-Effective", "DeVoice offers a free AI voice changer online, allowing users to experiment with voice effects at no cost. Ideal for content creators, gamers, streamers, and podcasters who want powerful voice transformation without expensive software."],
      ["Realistic Voice Changing with AI", "Realistic Results", "Unlike traditional voice changers, DeVoice uses neural AI models to preserve natural speech patterns. This realistic AI voice changer keeps your timing, emotion, and clarity - only the voice changes."],
      ["Advanced AI Voice Transformation Technology", "Advanced Technology", "Powered by modern AI voice synthesis and conversion technology, DeVoice intelligently adjusts pitch, tone, and vocal texture. The result is a natural-sounding AI voice changer suitable for storytelling, entertainment, and professional content."]
    ],
    why: [
      ["Transform Existing Voices Instantly", "Change how a voice sounds without re-recording. Upload or record audio and apply AI-powered voice transformations in seconds."],
      ["Natural Voice Conversion, Not Effects", "This AI voice changer modifies real vocal characteristics like pitch, tone, and resonance - producing realistic results instead of artificial voice effects."],
      ["Built for Videos, Streaming & Gaming", "Perfect for content creators, streamers, and gamers who need fast, reliable voice changing for videos, live streams, or recorded gameplay."],
      ["Multiple Voice Styles & Characters", "Switch between different voice identities, genders, and styles to match your content - all while keeping speech natural and expressive."],
      ["No Software Installation Required", "Use the AI voice changer directly in your browser. No plugins, no downloads, and no complicated setup."],
      ["Free to Try, Powerful When You Scale", "Start with the free AI voice changer and unlock advanced voice control options as your creative needs grow."]
    ],
    whyTitle: "6 Key Advantages of DeVoice AI Voice Changer",
    faqTitle: "Frequently Asked Questions – AI Voice Changer",
    cta: "Generate",
    ctaTitle: "Start Changing Your Voice with the #1 AI Voice Changer",
    ctaBody: "If you’re looking for a fast, realistic, and easy-to-use AI voice changer, DeVoice is built for creators like you. Change your voice instantly with AI!",
    ctaButton: "Try DeVoice AI Voice Changer Free",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Key Features",
    compactToolPage: true,
    testimonialTitle: "What Users Say About DeVoice",
    testimonialKicker: "Testimonials & Reviews",
    testimonials: [
      ["Alex R.", "DeVoice's AI voice changer transformed my streaming content! I can switch between different character voices in real-time, and the quality is amazing. My viewers love it!"],
      ["Maya T.", "As a content creator, I use DeVoice to add variety to my videos without hiring voice actors. The voice changing sounds so natural, not robotic like other tools I've tried."],
      ["Chris P.", "The AI voice changer is perfect for my gaming videos. I can create unique character voices that sound authentic. The best part? It's completely free to get started!"]
    ]
  },
  "audio-extract-from-video": {
    slug: "audio-extract-from-video",
    title: "Extract Audio from Video and get a MP3 Audio file",
    description: "DeVoice lets you instantly extract high-quality audio from any video platform — just upload your file, click split, and save in your preferred format.",
    seoTitle: "Audio Extract from Video —Online, Free, Fast",
    seoDescription: "Upload and extract audio from video files online. Fast, free, and secure audio extract from video with support for MP4, MOV, and more. Try now!",
    kind: "audio-extract",
    featureEyebrow: "Our Features",
    featureTitle: "What’s Different About DeVoice’s Audio Extractor?",
    guideTitle: "How to Extract Audio from Video in 3 Easy Steps",
    guideIntro: "Extract audio from video in three simple steps.",
    guide: [
      ["Step 1", "Upload Your Video File", "Choose a local MP4, MOV, or WEBM file from your device. Our audio extract from video tools works with most formats."],
      ["Step 2", "Wait for AI to Process", "Our AI will automatically analyze the video and separate audio from video. It detects vocals, music, and sound layers with precision."],
      ["Step 3", "Download the Audio", "Choose your preferred format (MP3, WAV, AAC) and instantly export audio from MP4 or any other supported format."]
    ],
    useCases: [
      ["Fast and Reliable Audio Extractor", "Fast", "DeVoice lets you audio extract from video in seconds. No signup, no delay. Upload your file and get studio-quality audio instantly."],
      ["Supports All Common Formats", "Formats", "Upload MP4, MOV, or WEBM and export audio from MP4 and other files into MP3, WAV, or AAC with no compression loss."],
      ["Secure & Private Processing", "Security", "All video and audio processing is done in-browser. Your files are never stored, keeping your data safe while you get audio from video."],
      ["Mobile-Friendly, No Downloads", "Mobile", "Whether you're on desktop or mobile, DeVoice is optimized for all devices. Just open, upload, and convert video to sound in a tap."]
    ],
    why: [
      ["Get Music from Video Clips", "Found a catchy song in your favorite YouTube vlog or TikTok? Use DeVoice to audio extract from video quickly and easily."],
      ["Convert Online Courses to Audio", "Turn long educational videos into audio you can listen to while commuting, studying, or working offline."],
      ["Reuse Video Soundtracks for Content Creation", "Pull narration, music beds, or spoken clips from video files and reuse them in shorts, reels, courses, or social posts."]
    ],
    whyTitle: "Explore the Infinite Charm of DeVoice’s Extract Audio from Video",
    faqTitle: "FAQ",
    cta: "Extract Audio Now",
    ctaTitle: "Start Using DeVoice – Your Ultimate Audio Extractor from Video",
    ctaBody: "Upload your video and get a clean MP3 audio file online.",
    ctaButton: "Extract Audio Now",
    sectionOrder: "benefits-first",
    guideKicker: "Tutorial",
    featureKicker: "Our Features",
    compactToolPage: true
  },
  "transcribe-youtube-videos": {
    slug: "transcribe-youtube-videos",
    title: "Transcribe YouTube Video Online with AI",
    description: "Devoice.io AI-powered transcription technology converts spoken words from YouTube videos into accurate text instantly. No downloads, no plugins, and no manual typing. Simply paste the video URL, and let the AI do the rest.",
    seoTitle: "Transcribe YouTube Video Online —Fast & Accurate | Devoice",
    seoDescription: "Transcribe YouTube videos instantly with Devoice.io. Get accurate, AI-powered transcripts online for free. Perfect for creators, students, and professionals.",
    kind: "upload",
    featureEyebrow: "Advanced Features",
    featureTitle: "Unlock the Power of AI: Transcribe YouTube Videos Instantly",
    guideTitle: "How to Transcribe YouTube Videos with Devoice.io",
    guideIntro: "From video to text, the whole process takes just a few minutes - saving hours of manual note-taking.",
    guide: [
      ["01", "Paste Your YouTube URL", "Simply copy the URL of the YouTube video you want to transcribe and paste it into Devoice.io. The AI supports videos of any length and multiple languages."],
      ["02", "Start AI Transcription", "Click Convert and let advanced speech recognition technology process the video. Every word, phrase, and punctuation mark is captured accurately."],
      ["03", "Download or Edit Your Transcript", "Once transcription is complete, you can edit the text online or export it in your preferred format. Shareable transcripts help teammates, clients, or classmates review the content."]
    ],
    useCases: [
      ["Effortless YouTube Video Transcription", "YouTube Transcription", "Devoice.io turns YouTube videos into precise, editable text without manual typing. From short tutorials to hour-long interviews, AI can handle it all."],
      ["Summarize and Highlight Key Insights", "Generate Insights", "Transform long videos into clear transcripts and summaries so you can find important ideas faster."],
      ["Export or Share Your YouTube Video Transcripts Effortlessly", "Export", "Use your transcript in notes, captions, research, documentation, or team reviews without replaying the whole video."]
    ],
    why: [
      ["Fast & Accurate AI Transcription", "Devoice.io uses advanced AI models to ensure every word is captured accurately, even in noisy environments or with multiple speakers."],
      ["Works with Any YouTube Video", "From short tutorials to hour-long lectures, Devoice.io can transcribe YouTube videos of many lengths. Paste the URL and start."],
      ["Multilingual Support", "Transcribe YouTube videos in over 50 languages for international teams, multilingual creators, and students learning new languages."],
      ["Secure & Private", "Your submitted URLs and generated transcripts are handled with privacy in mind inside the DeVoice workflow."],
      ["Easy-to-Use Interface", "No downloads, plugins, or manual typing. Paste the video URL, start transcription, and review your result."]
    ],
    whyTitle: "Why Choose Devoice.io to Transcribe YouTube Videos",
    faqTitle: "FAQ – Transcribe YouTube Video",
    cta: "Transcribe YouTube Video Now →",
    ctaTitle: "Start Transcribing YouTube Videos Today",
    ctaBody: "Stop manually typing or missing details from your favorite YouTube content. Paste your YouTube URL now and experience fast, free, and AI-powered transcription online.",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Advanced Features",
    compactToolPage: false,
    dedicatedUploadPanel: true,
    hideGenericDiscoverySections: true
  },
  "ai-music-generator": {
    slug: "ai-music-generator",
    title: "AI Music Generator That Turns Ideas into Songs in Seconds",
    description: "The most advanced song maker free online. Create professional music with vocals, lyrics, and instrumentals in any genre. Generate complete songs from text descriptions in minutes.",
    seoTitle: "AI Music Generator Online —Create Songs Free with DeVoice",
    seoDescription: "DeVoice lets you generate royalty-free music by entering a title and style. Fast, free to try, and no music skills are required.",
    kind: "music",
    featureEyebrow: "AI Music Features",
    featureTitle: "Turn Ideas into Music—Core Capabilities of an AI Music Generator",
    guideTitle: "How to Use the AI Music Generator in 3 Easy Steps",
    guideIntro: "Enter a song title, choose a style, describe the sound you want, and let DeVoice create a song draft.",
    guide: [
      ["01", "Describe Your Music Idea", "Write a prompt with genre, mood, tempo, instruments, length or where the music will be used."],
      ["02", "Choose a Music Style", "Select a style direction such as cinematic, pop, lo-fi, EDM, ambient or acoustic."],
      ["03", "Generate and Download", "Create an AI music preview, listen online, and export MP3 or WAV for editing workflows."]
    ],
    useCases: [
      ["Draft Soundtracks for Videos", "Video", "Generate quick background music ideas for shorts, demos, explainers and social edits."],
      ["Explore Campaign Music Directions", "Marketing", "Test different moods and styles before commissioning final music or production assets."],
      ["Create Placeholder Tracks", "Production", "Use AI music previews while editing timelines, prototypes, decks and early creative cuts."],
      ["Brainstorm Original Music Concepts", "Creative", "Turn rough mood notes into structured music directions you can iterate on."]
    ],
    why: [
      ["Prompt-to-Music Workflow", "Describe what you need and DeVoice prepares an AI music preview record."],
      ["Multiple Style Directions", "Choose cinematic, pop, lo-fi, EDM, ambient or acoustic style presets."],
      ["MP3 and WAV Exports", "Download compact MP3 previews or WAV files for editing workflows."],
      ["Private Resource History", "Generated music jobs stay in your DeVoice resources for review and export."],
      ["Works Online", "Create AI music ideas in the browser without installing audio software."],
      ["Fast Creative Iteration", "Generate a track direction quickly, adjust the prompt, and try another version."]
    ],
    whyTitle: "What Users Say About the AI Music Generator",
    faqTitle: "AI music generator – FAQ",
    cta: "Generate Song",
    ctaTitle: "Try the AI music generator from DeVoice today and turn your ideas into real songs instantly.",
    ctaBody: "Turn your idea into a royalty-free song with DeVoice's online AI music generator.",
    ctaButton: "Generate Music Now →",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "AI Music Features",
    compactToolPage: true
  },
  "ai-rap-generator": {
    slug: "ai-rap-generator",
    title: "Royalty-Free AI Rap Generator Online",
    description: "No skills, no licenses, no limits — this next-gen AI rap generator lets you create royalty-free rap tracks effortlessly, like a pro in seconds.",
    seoTitle: "AI Rap Generator Online Free: Create Royalty-Free Rap Music",
    seoDescription: "Create royalty-free rap tracks in seconds with DeVoice’s AI rap generator online free. Instantly turn lyrics to song using powerful AI voices and beats.",
    kind: "rap",
    featureEyebrow: "AI Rap Features",
    featureTitle: "DeVoice AI Rap Generator: Your All-in-One Creative Platform",
    guideTitle: "How to Use the DeVoice AI Rap Generator in 3 Easy Steps",
    guideIntro: "Give DeVoice a title, style, voice direction, and lyrics or description to generate an AI rap track.",
    guide: [
      ["01", "Enter Your Rap Prompt", "Describe the theme, vibe, tempo, language, rhyme direction or hook idea."],
      ["02", "Choose a Rap Style", "Pick a style such as trap, boom bap, drill, melodic, old school or club."],
      ["03", "Generate Rap Audio", "Create a rap preview, listen online, and export MP3 or WAV for demos and drafts."]
    ],
    useCases: [
      ["Draft Hooks and Flow Ideas", "Hooks", "Generate quick rap directions for hooks, verses, demos and freestyle concepts."],
      ["Prototype Campaign Audio", "Marketing", "Create rhythmic voice and music-style drafts for short ads and social campaigns."],
      ["Explore Different Rap Styles", "Styles", "Try trap, boom bap, melodic or drill directions from the same idea."],
      ["Create Placeholder Rap Tracks", "Demos", "Use rap previews while arranging, editing or pitching creative concepts."]
    ],
    why: [
      ["Prompt-to-Rap Generation", "Turn a theme and style into a downloadable rap audio preview."],
      ["Style Presets", "Choose common rap style directions and iterate quickly."],
      ["MP3 and WAV Exports", "Download MP3 for sharing or WAV for editing workflows."],
      ["Private Resources", "Generated rap jobs remain available in your DeVoice resources."],
      ["Fast Drafting", "Create rough rap ideas without setting up a studio session."],
      ["Browser Workflow", "Generate rap previews online across desktop and mobile."]
    ],
    whyTitle: "Why Choose DeVoice’s AI rap Generator?",
    faqTitle: "AI rap generator – FAQ",
    cta: "Generate Song",
    ctaTitle: "Start Creating Unique Flow with AI Rap Generator for Free!",
    ctaBody: "Describe a rap idea, choose a style, and generate a royalty-free song draft.",
    ctaButton: "Start to Be A Rapper with AI Rap Generator Now!",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "AI Rap Features",
    compactToolPage: true
  },
  "ai-rap-lyrics-generator": {
    slug: "ai-rap-lyrics-generator",
    title: "Unleash Your Creativity with Our Free AI Rap Lyrics Generator",
    description: "Ready to drop the next viral verse? With DeVoice’s AI rap lyrics generator, turning thoughts into hard-hitting bars has never been easier.",
    seoTitle: "AI Rap Lyrics Generator Online Free: Create Lyrics in Second",
    seoDescription: "Create custom rap lyrics instantly with our free AI rap lyrics generator online free. Turn your ideas into bars using powerful AI. No adds,just click and rhyme.",
    kind: "lyrics",
    featureEyebrow: "Rap Lyrics Features",
    featureTitle: "DeVoice AI Rap Lyrics Generator: Write Powerful Verses with AI",
    guideTitle: "How to Use the DeVoice AI Rap lyrics Generator in 3 Easy Steps",
    guideIntro: "Enter a song topic, pick a mood and language, optionally add words to include, then generate rap lyrics.",
    guide: [
      ["01", "Describe the Lyrics Topic", "Enter a theme, story, mood, keywords, language or rhyme direction."],
      ["02", "Choose a Rap Style", "Select a style direction for flow and structure."],
      ["03", "Generate Lyrics", "Create structured lyrics with verses, hook, bridge and exportable text records."]
    ],
    useCases: [
      ["Write Hook Ideas Quickly", "Hooks", "Generate hook concepts and chorus lines when starting a track or campaign."],
      ["Draft Verses from a Story", "Verses", "Turn a theme, character or narrative into structured rap verses."],
      ["Explore Rhyme Directions", "Rhymes", "Try different moods and rhyme styles before polishing final lyrics."],
      ["Create Lyrics for Demos", "Demos", "Use generated lyrics for placeholders, creative prompts and early production drafts."]
    ],
    why: [
      ["Structured Lyrics Output", "Generate verses, hook, bridge and a concise writing summary."],
      ["Style Control", "Choose trap, boom bap, storytelling, battle rap, melodic or conscious directions."],
      ["Text Exports", "Download lyrics as TXT, transcript, summary or JSON records."],
      ["Private Resources", "Generated lyrics stay available in your DeVoice resources."],
      ["Fast Ideation", "Move from rough concept to editable lyrics in seconds."],
      ["Works Online", "Write rap lyrics in the browser across desktop and mobile."]
    ],
    whyTitle: "Why Choose DeVoice’s AI rap Lyrics Generator?",
    faqTitle: "AI rap Lyrics generator – FAQ",
    cta: "Generate Lyrics",
    ctaTitle: "Start Creating Unique Lyrics with AI Rap Lyrics Generator for Free!",
    ctaBody: "Describe your topic and generate structured rap lyrics you can edit and export.",
    ctaButton: "Start to Create Your Own Rap Music Lyrics Now!",
    sectionOrder: "guide-first",
    guideKicker: "User Guide",
    featureKicker: "Rap Lyrics Features",
    compactToolPage: true
  },
  "youtube-transcript-generator": {
    slug: "youtube-transcript-generator",
    title: "Free YouTube Transcript Generator",
    description: "Paste a link, choose your language, and get a readable transcript in seconds.",
    seoTitle: "Free YouTube Transcript Generator Online – DeVoice",
    seoDescription: "Free YouTube transcript generator by DeVoice. Convert YouTube videos to accurate text in seconds. Fast AI, clean output, no skills needed.",
    kind: "youtube",
    featureEyebrow: "YouTube Transcript Features",
    featureTitle: "How Our YouTube Transcript Generator Works for You",
    guideTitle: "How to Use DeVoice YouTube Transcript Generator in 3 Easy Steps",
    guideIntro: "Paste a public YouTube URL and DeVoice turns the speech into readable text.",
    guide: [
      ["01", "Paste Any YouTube Video Link", "Copy the URL of the YouTube video you want to transcribe and paste it into DeVoice's YouTube transcript generator."],
      ["02", "Convert YouTube Video to Transcript Automatically", "DeVoice uses AI speech recognition to analyze the video audio and convert it to a transcript in seconds."],
      ["03", "Copy or Download Your YouTube Transcript", "Copy the clean transcript or download it for blogging, subtitles, SEO content, research or study notes."]
    ],
    useCases: [
      ["Instantly Turn YouTube Videos into Clear, Readable Text", "YouTube Transcript Generator", "DeVoice accurately captures spoken words, structures them into natural sentences, and delivers transcripts that are easy to read and review."],
      ["Reliable YouTube Video Transcript Generator for Any Use Case", "YouTube Transcript Generator", "Use DeVoice for lectures, interviews, tutorials or long-form discussions with different speaking speeds and audio styles."],
      ["Simple YouTube to Transcript Conversion with One Paste", "YouTube Transcript Generator", "Paste a YouTube link and let AI do the work with no manual transcription, special settings or learning curve."]
    ],
    why: [
      ["Designed Specifically for YouTube Transcription", "DeVoice focuses on accurately converting spoken YouTube video content into text that's easy to read and understand."],
      ["High Accuracy You Can Rely On", "AI captures natural speech, different accents and real-world audio so you do not miss important details in YouTube videos."],
      ["Works with Long and Short YouTube Videos", "From short clips to hour-long lectures or interviews, DeVoice handles YouTube video transcription smoothly."],
      ["Fast Results, No Waiting", "Get your YouTube transcript quickly so you can focus on reading, learning or reviewing content."],
      ["Simple for Everyone to Use", "Paste a YouTube link and instantly turn video into text, even if it is your first time."],
      ["Secure and Private Processing", "Your YouTube links and transcripts are handled securely, and your content is not used without permission."]
    ],
    whyTitle: "Why People Choose DeVoice for YouTube Transcripts",
    faqTitle: "Frequently Asked Questions",
    cta: "Get YouTube Transcript Free",
    ctaTitle: "Turn Any YouTube Video into Text Instantly",
    ctaBody: "Paste a YouTube link and turn video into text instantly with DeVoice - fast, accurate, and effortless.",
    sectionOrder: "guide-first",
    featureKicker: "YouTube Transcript Features",
    testimonialTitle: "What Users Are Saying about DeVoice YouTube Transcript Generator?",
    testimonials: [
      ["Emily Carter", "DeVoice is the most reliable YouTube transcript generator I've used. The text is clear, readable, and easy to review."],
      ["Michael Thompson", "I use DeVoice to generate transcripts for YouTube lectures. It helps me understand long videos much faster."],
      ["Sophia Nguyen", "Turning YouTube videos into transcripts with DeVoice makes studying and note-taking so much easier."],
      ["Daniel Brooks", "I prefer reading over watching. DeVoice lets me get YouTube transcripts instantly without replaying videos."],
      ["Laura Martinez", "This YouTube transcript generator helps me quote videos accurately for my assignments."],
      ["Kevin Wilson", "I often review interviews and talks on YouTube. DeVoice saves me time by giving me clean transcripts."]
    ],
    hideGenericDiscoverySections: true
  },
  "youtube-subtitle-downloader": {
    slug: "youtube-subtitle-downloader",
    title: "Free YouTube Subtitle Downloader",
    description: "Download YouTube subtitles in any language with our free online tool. Fast, accurate, and no sign-up required.",
    seoTitle: "Free YouTube Subtitle Downloader Online | DeVoice",
    seoDescription: "Download YouTube subtitles instantly with DeVoice’s YouTube Subtitle Downloader. Free, accurate, and online — Supports more than 100 languages",
    kind: "youtube",
    featureEyebrow: "YouTube Subtitle Features",
    featureTitle: "Powerful Features of DeVoice's YouTube Subtitle Downloader",
    guideTitle: "How to Use YouTube Subtitle Downloader in 3 Easy Steps",
    guideIntro: "Paste a YouTube link, fetch available subtitles and download the format you need.",
    guide: [
      ["01", "Copy the YouTube Video Link", "Find the YouTube video you want subtitles from and copy its URL directly from the browser or app."],
      ["02", "Paste the Link", "Open DeVoice's YouTube Subtitle Downloader and paste the video link into the input box."],
      ["03", "Choose Subtitle Language & Format", "Select your preferred language and subtitle format, such as SRT, TXT, or VTT, then download instantly."]
    ],
    useCases: [
      ["Accurate & Well-Structured Subtitle Extraction", "Subtitle Downloader", "Extract captions with high accuracy and clean structure while keeping timing, line breaks and readability intact."],
      ["Multiple Languages and Flexible Export Formats", "Subtitle Downloader", "Download available subtitle languages and export captions as SRT for editing, TXT for reading or VTT for web players."],
      ["Fast, Fully Online, and Completely Free", "Subtitle Downloader", "Process videos in seconds from your browser with no software installation, sign-ups or hidden limits."],
      ["Privacy-Focused and Compatible Across All Devices", "Subtitle Downloader", "DeVoice handles videos and subtitle files temporarily and works smoothly on Windows, macOS, Android and iOS."]
    ],
    why: [],
    whyTitle: "",
    faqTitle: "Frequently Asked Questions",
    cta: "Try it Free",
    ctaTitle: "Download YouTube Subtitles in Seconds",
    ctaBody: "Turn videos into readable captions with DeVoice's YouTube Subtitle Downloader. Fast, free, and accurate - start downloading subtitles now.",
    sectionOrder: "guide-first",
    featureKicker: "YouTube Subtitle Downloader Features",
    testimonialTitle: "What Users Say About Our YouTube Subtitle Downloader?",
    testimonials: [
      ["Emily Carter", "DeVoice's YouTube Subtitle Downloader saves me hours. I grab captions instantly and repurpose them for blogs and shorts."],
      ["Lucas Martin", "I use this tool to download YouTube subtitles for studying. It's accurate and incredibly easy."],
      ["Sofia Alvarez", "Perfect for extracting subtitles from lectures. Clean SRT files every time."],
      ["Daniel Wright", "The timing is spot-on. This YouTube Subtitle Downloader integrates perfectly into my editing workflow."],
      ["Mina Kobayashi", "Being able to download subtitles in different languages is a huge plus for translation work."],
      ["Oliver Thompson", "I often need transcripts from videos. DeVoice makes subtitle downloading fast and reliable."]
    ],
    hideGenericDiscoverySections: true
  },
  "youtube-video-summarizer": {
    slug: "youtube-video-summarizer",
    title: "AI YouTube Video Summarizer",
    description: "Copy and paste the YouTube video link to quickly extract key points using AI.",
    seoTitle: "Free AI YouTube Video Summarizer Online | DeVoice",
    seoDescription: "Summarize YouTube videos with AI in seconds. Get accurate video summaries, key points, and timestamps.",
    kind: "youtube",
    featureEyebrow: "YouTube Video Summarizer Features",
    featureTitle: "Powerful Features of DeVoice's AI YouTube Video Summarizer",
    guideTitle: "How to Use the YouTube Video Summarizer in 3 Easy Steps",
    guideIntro: "Follow these simple steps to get an AI-generated summary from any YouTube video.",
    guide: [
      ["01", "Copy the YouTube Video URL", "Find the YouTube video you want to summarize and copy its link from the browser or app."],
      ["02", "Paste the Link", "Go to DeVoice's YouTube Video Summarizer and paste the video link into the input box."],
      ["03", "Click Summarize and Get Results", "Click Summarize and receive an AI-generated summary with key points and timestamps."]
    ],
    useCases: [
      ["Extract the Most Valuable Video Clips", "AI Summarizer", "Extract key points from tutorials, presentations, video commentaries and in-depth content without watching every detail."],
      ["Highly Compatible AI Models for YouTube Platform", "AI Summarizer", "Summarize videos, Shorts, playlists and chaptered content with adaptive summaries."],
      ["High-Quality YouTube Content Preview", "AI Summarizer", "Paste a video link and generate a quick summary preview before deciding whether the video is useful."],
      ["Effectively Interpret Long YouTube Videos", "AI Summarizer", "Skip unfocused sections and get effective summaries that overcome niche languages, technical jargon and unclear content."]
    ],
    why: [
      ["Fast YouTube Video Summarization", "Paste any YouTube link and get a summary within seconds. The AI processes long-form videos quickly and efficiently."],
      ["Clear & Structured Summaries", "Summaries are delivered in clean paragraphs or bullet points, making them easy to scan and understand."],
      ["No Download Required", "Summarize YouTube videos online directly in your browser - no installation or extensions needed."],
      ["Works for Long & Short Videos", "From short tutorials to hour-long lectures, the YouTube summary generator handles all video lengths."],
      ["Supports Various YouTube Content Types", "Automatically handles videos, Shorts, playlists, and chapter jumps, adapting summaries accordingly."],
      ["Privacy-Focused AI Processing", "Your video links and summaries are processed securely with privacy in mind. No files are stored."]
    ],
    whyTitle: "Why Choose DeVoice AI YouTube Video Summarizer?",
    faqTitle: "Frequently Asked Questions",
    cta: "Generate Your AI Summary Now",
    ctaTitle: "Start Summarizing YouTube Videos Now",
    ctaBody: "Stop spending hours watching full-length content. Use DeVoice's free YouTube video summarizer online to get intelligent summaries in seconds.",
    sectionOrder: "guide-first",
    featureKicker: "YouTube Video Summarizer Features",
    hideGenericDiscoverySections: true
  }
};

const recommended = [
  ["AI Noise Remover", "Remove background noise from audio", "remove-background-noise", Headphones],
  ["Video Summarizer", "Get key points from any video", "youtube-video-summarizer", Brain],
  ["Text to Speech", "Convert text to natural voice", "text-to-speech", MicVocal]
] as const;

const examples = [
  { title: "How to Actually Get Better at Math", time: "10m 37s", label: "Math", imageSrc: "/devoice-assets/youtube-icon1.webp" },
  { title: "Mastering Learning Efficiency Proven Strategies for Faster, Deeper, and Smarter Learning", time: "1m 44s", label: "Study", imageSrc: "/devoice-assets/audio-icon.svg" },
  { title: "Google Gemini Deep Research Updates are INSANE", time: "6m 51s", label: "AI", imageSrc: "/devoice-assets/audio-icon.svg" },
  { title: "A Four-Word Buddhist Teaching for Instant Calm and (Just Maybe) Lasting Peace | Bart van Melik", time: "16m 16s", label: "Talk", imageSrc: "/devoice-assets/audio-icon.svg" }
];

type ToolImage = { src: string; width: number; height: number };

// 各工具页的「Benefits」配图，与 devoice.io 真站逐页一致。
const benefitImageSets: Record<DeVoiceToolSlug, ToolImage[]> = {
  home: [
    { src: "/assets/youtube-transcript-generator/feature1.webp", width: 1024, height: 1024 },
    { src: "/assets/index/hero.webp", width: 1024, height: 1024 },
    { src: "/assets/index/hero.webp", width: 1024, height: 1024 }
  ],
  "ai-speech-to-text": [
    { src: "/assets/youtube-transcript-generator/feature1.webp", width: 1024, height: 1024 },
    { src: "/assets/index/hero.webp", width: 1024, height: 1024 },
    { src: "/assets/index/hero.webp", width: 1024, height: 1024 }
  ],
  "audio-to-text": [
    { src: "/assets/convert-audio-to-text/feature4.webp", width: 1024, height: 1024 },
    { src: "/assets/convert-audio-to-text/feature5.webp", width: 1024, height: 1024 },
    { src: "/assets/convert-audio-to-text/feature6.webp", width: 1024, height: 1024 }
  ],
  "video-to-text": [
    { src: "/assets/video-to-text/feature1.webp", width: 773, height: 486 },
    { src: "/assets/video-to-text/feature2.webp", width: 677, height: 406 },
    { src: "/assets/video-to-text/feature3.webp", width: 789, height: 631 }
  ],
  "remove-background-noise": [
    { src: "/assets/remove-background-noise/feature1.webp", width: 768, height: 791 },
    { src: "/assets/remove-background-noise/feature2.webp", width: 768, height: 672 },
    { src: "/assets/remove-background-noise/feature3.webp", width: 768, height: 870 },
    { src: "/assets/remove-background-noise/feature4.webp", width: 768, height: 663 }
  ],
  "ai-noise-filter": [
    { src: "/assets/remove-background-noise/feature1.webp", width: 768, height: 791 },
    { src: "/assets/remove-background-noise/feature2.webp", width: 768, height: 672 },
    { src: "/assets/remove-background-noise/feature3.webp", width: 768, height: 870 },
    { src: "/assets/remove-background-noise/feature4.webp", width: 768, height: 663 }
  ],
  "ai-voice-enhancer-isolate": [
    { src: "/assets/ai-voice-enhancer-isolate/feature1.jpg", width: 6000, height: 4000 },
    { src: "/assets/ai-voice-enhancer-isolate/feature2.jpg", width: 4000, height: 2667 },
    { src: "/assets/ai-voice-enhancer-isolate/feature3.png", width: 1248, height: 832 },
    { src: "/assets/ai-voice-enhancer-isolate/feature4.png", width: 1248, height: 832 }
  ],
  "ai-voice-changer": [
    { src: "/assets/ai-voice-changer/feature1.webp", width: 1250, height: 832 },
    { src: "/assets/ai-voice-changer/feature2.webp", width: 1250, height: 821 },
    { src: "/assets/ai-voice-changer/feature3.webp", width: 1250, height: 748 },
    { src: "/assets/ai-voice-changer/feature4.webp", width: 1250, height: 756 }
  ],
  "text-to-speech": [
    { src: "/assets/text-to-speech/feature1.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature2.webp", width: 4147, height: 3069 },
    { src: "/assets/text-to-speech/feature3.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature4.webp", width: 6100, height: 4067 }
  ],
  "ai-voice-generator": [
    { src: "/assets/text-to-speech/feature1.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature2.webp", width: 4147, height: 3069 },
    { src: "/assets/text-to-speech/feature3.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature4.webp", width: 6100, height: 4067 }
  ],
  "ai-voice-actors": [
    { src: "/assets/text-to-speech/feature1.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature2.webp", width: 4147, height: 3069 },
    { src: "/assets/text-to-speech/feature3.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature4.webp", width: 6100, height: 4067 }
  ],
  "ai-dubbing": [
    { src: "/assets/text-to-speech/feature1.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature2.webp", width: 4147, height: 3069 },
    { src: "/assets/text-to-speech/feature3.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature4.webp", width: 6100, height: 4067 }
  ],
  "ai-voice-cloning": [
    { src: "/assets/ai-voice-cloning/feature1.webp", width: 3648, height: 2434 },
    { src: "/assets/ai-voice-cloning/feature2.webp", width: 6240, height: 4160 },
    { src: "/assets/ai-voice-cloning/feature3.webp", width: 2500, height: 1667 },
    { src: "/assets/ai-voice-cloning/feature4.webp", width: 6000, height: 4000 }
  ],
  "audio-extract-from-video": [
    { src: "/assets/video-to-text/feature1.webp", width: 773, height: 486 },
    { src: "/assets/video-to-text/feature2.webp", width: 677, height: 406 },
    { src: "/assets/video-to-text/feature3.webp", width: 789, height: 631 }
  ],
  "transcribe-youtube-videos": [
    { src: "/assets/youtube-transcript-generator/feature1.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-transcript-generator/feature2.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-transcript-generator/feature3.webp", width: 1024, height: 1024 }
  ],
  "ai-music-generator": [
    { src: "/assets/text-to-speech/feature1.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature2.webp", width: 4147, height: 3069 },
    { src: "/assets/text-to-speech/feature3.webp", width: 1248, height: 832 },
    { src: "/assets/text-to-speech/feature4.webp", width: 6100, height: 4067 }
  ],
  "ai-rap-generator": [
    { src: "/assets/ai-voice-cloning/feature1.webp", width: 3648, height: 2434 },
    { src: "/assets/ai-voice-cloning/feature2.webp", width: 6240, height: 4160 },
    { src: "/assets/ai-voice-cloning/feature3.webp", width: 2500, height: 1667 },
    { src: "/assets/ai-voice-cloning/feature4.webp", width: 6000, height: 4000 }
  ],
  "ai-rap-lyrics-generator": [
    { src: "/assets/ai-voice-cloning/feature1.webp", width: 3648, height: 2434 },
    { src: "/assets/ai-voice-cloning/feature2.webp", width: 6240, height: 4160 },
    { src: "/assets/ai-voice-cloning/feature3.webp", width: 2500, height: 1667 },
    { src: "/assets/ai-voice-cloning/feature4.webp", width: 6000, height: 4000 }
  ],
  "youtube-transcript-generator": [
    { src: "/assets/youtube-transcript-generator/feature1.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-transcript-generator/feature2.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-transcript-generator/feature3.webp", width: 1024, height: 1024 }
  ],
  "youtube-subtitle-downloader": [
    { src: "/assets/youtube-subtitle-downloader/feature1.webp", width: 4160, height: 6240 },
    { src: "/assets/youtube-subtitle-downloader/feature2.webp", width: 3999, height: 2667 },
    { src: "/assets/youtube-subtitle-downloader/feature3.webp", width: 5911, height: 3941 },
    { src: "/assets/youtube-subtitle-downloader/feature4.webp", width: 6000, height: 4000 }
  ],
  "youtube-video-summarizer": [
    { src: "/assets/youtube-video-summarizer/feature1.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-video-summarizer/feature2.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-video-summarizer/feature3.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-video-summarizer/feature4.webp", width: 1024, height: 1024 }
  ]
};

const indexSteps: [ToolImage, ToolImage, ToolImage] = [
  { src: "/assets/index/step1.webp", width: 1054, height: 609 },
  { src: "/assets/index/step2.webp", width: 1054, height: 609 },
  { src: "/assets/index/step3.webp", width: 1054, height: 609 }
];

const voiceSteps: [ToolImage, ToolImage, ToolImage] = [
  { src: "/assets/ai-voice-generator/step1.webp", width: 2364, height: 1482 },
  { src: "/assets/ai-voice-generator/step2.webp", width: 2364, height: 1482 },
  { src: "/assets/ai-voice-generator/step3.webp", width: 2364, height: 1482 }
];

const ytSteps: [ToolImage, ToolImage, ToolImage] = [
  { src: "/assets/youtube-transcript-generator/step1.webp", width: 1024, height: 1024 },
  { src: "/assets/youtube-transcript-generator/step2.webp", width: 1024, height: 1024 },
  { src: "/assets/youtube-transcript-generator/step3.webp", width: 1024, height: 1024 }
];

// 各工具页的「How to」步骤配图，与 devoice.io 真站逐页一致。
const guideImageSets: Record<DeVoiceToolSlug, [ToolImage, ToolImage, ToolImage]> = {
  home: indexSteps,
  "ai-speech-to-text": indexSteps,
  "audio-to-text": indexSteps,
  "video-to-text": indexSteps,
  "remove-background-noise": [
    { src: "/assets/remove-background-noise/step1.webp", width: 768, height: 458 },
    { src: "/assets/remove-background-noise/step2.webp", width: 768, height: 483 },
    { src: "/assets/remove-background-noise/step3.webp", width: 768, height: 482 }
  ],
  "ai-noise-filter": [
    { src: "/assets/remove-background-noise/step1.webp", width: 768, height: 458 },
    { src: "/assets/remove-background-noise/step2.webp", width: 768, height: 483 },
    { src: "/assets/remove-background-noise/step3.webp", width: 768, height: 482 }
  ],
  "ai-voice-enhancer-isolate": [
    { src: "/assets/remove-background-noise/step1.webp", width: 768, height: 458 },
    { src: "/assets/remove-background-noise/step2.webp", width: 768, height: 483 },
    { src: "/assets/remove-background-noise/step3.webp", width: 768, height: 482 }
  ],
  "ai-voice-changer": voiceSteps,
  "text-to-speech": voiceSteps,
  "ai-voice-generator": voiceSteps,
  "ai-voice-actors": voiceSteps,
  "ai-dubbing": voiceSteps,
  "ai-voice-cloning": voiceSteps,
  "audio-extract-from-video": indexSteps,
  "transcribe-youtube-videos": ytSteps,
  "ai-music-generator": voiceSteps,
  "ai-rap-generator": voiceSteps,
  "ai-rap-lyrics-generator": voiceSteps,
  "youtube-transcript-generator": ytSteps,
  "youtube-subtitle-downloader": ytSteps,
  "youtube-video-summarizer": [
    { src: "/assets/youtube-video-summarizer/step1.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-video-summarizer/step2.webp", width: 1024, height: 1024 },
    { src: "/assets/youtube-video-summarizer/step3.webp", width: 1024, height: 1024 }
  ]
};

export function getToolConfig(slug: string): ToolConfig | undefined {
  return toolConfigs[slug as DeVoiceToolSlug];
}

const zhCnToolOverrides: Partial<Record<DeVoiceToolSlug, Partial<ToolConfig>>> = {
  home: {
    title: "免费语音转文字转换器",
    description: "上传音频或视频，使用 AI 快速生成准确、可编辑的文字稿。",
    featureEyebrow: "AI 转写工具",
    featureTitle: "AI 语音转文字的真实使用场景",
    guideTitle: "如何在线将语音转文字？",
    guideIntro: "上传文件，让 AI 处理语音并立即获得准确文稿。",
    whyTitle: "为什么选择 DeVoice 语音转文字？",
    faqTitle: "关于 DeVoice 你需要知道的事",
    cta: "立即转写语音",
    ctaTitle: "今天就在线转换语音为文字",
    ctaBody: "使用 DeVoice 将音频和视频快速转成准确文字稿。"
  },
  "ai-speech-to-text": {
    title: "免费语音转文字转换器",
    description: "上传音频或视频，使用 AI 快速生成准确、可编辑的文字稿。",
    featureEyebrow: "AI 转写工具",
    featureTitle: "AI 语音转文字的真实使用场景",
    guideTitle: "如何在线将语音转文字？",
    guideIntro: "上传文件，让 AI 处理语音并立即获得准确文稿。",
    whyTitle: "为什么选择 DeVoice 语音转文字？",
    faqTitle: "关于 DeVoice 你需要知道的事",
    cta: "立即转写语音",
    ctaTitle: "今天就在线转换语音为文字",
    ctaBody: "使用 DeVoice 将音频和视频快速转成准确文字稿。"
  },
  "audio-to-text": {
    title: "免费 AI 音频转文字转换器",
    description: "上传音频或视频文件，使用 DeVoice 音频转文字工具在几秒内生成准确、可编辑的文稿。",
    featureEyebrow: "音频转文字功能",
    featureTitle: "谁适合使用我们的音频转文字工具？",
    guideTitle: "如何在几秒内将音频转文字？",
    guideIntro: "使用 AI 音频转文字工具，只需几步即可完成转写。",
    whyTitle: "为什么选择我们的音频转文字工具？",
    faqTitle: "音频转文字常见问题",
    cta: "立即转换音频为文字",
    ctaTitle: "今天就在线转换音频为文字",
    ctaBody: "开始使用 DeVoice 将音频文件转换成准确文本。"
  },
  "video-to-text": {
    title: "免费 AI 视频转文字转换器",
    description: "上传视频文件，使用 DeVoice 视频转文字工具快速生成准确、可编辑的视频文稿。",
    featureEyebrow: "视频转文字功能",
    featureTitle: "谁适合使用我们的视频转文字工具？",
    guideTitle: "如何在几秒内转写视频为文字？",
    guideIntro: "使用 AI 视频转文字工具，只需几步即可在线转写视频。",
    whyTitle: "为什么选择我们的视频转文字工具？",
    faqTitle: "视频转文字常见问题",
    cta: "立即转写视频为文字",
    ctaTitle: "今天就在线转写视频为文字",
    ctaBody: "将视频中的语音内容转换成字幕、笔记和可搜索文本。"
  },
  "remove-background-noise": {
    title: "在线去除音频背景噪音",
    description: "直接在浏览器中免费去除音频背景噪音。",
    featureEyebrow: "功能亮点",
    featureTitle: "用 AI 轻松去除音频噪音",
    guideTitle: "如何在线免费去除音频背景噪音",
    guideIntro: "只需三步即可在线去除音频背景噪音。",
    whyTitle: "用 AI 轻松去除音频噪音",
    faqTitle: "常见问题",
    cta: "上传音频并去除噪音",
    ctaTitle: "在线免费去除音频噪音",
    ctaBody: "无需专业技能，使用 AI 即刻消除背景噪音。",
    featureKicker: "功能亮点",
    guideKicker: "使用教程"
  },
  "text-to-speech": {
    title: "免费在线 AI 文本转语音",
    description: "输入文本，将其转换成自然流畅的语音。",
    featureEyebrow: "核心功能",
    featureTitle: "不可错过的文本转语音使用场景",
    guideTitle: "如何用 DeVoice 三步完成文本转语音",
    guideIntro: "只需三步即可把文字转换成自然语音。",
    whyTitle: "为什么使用 DeVoice 文本转语音工具？",
    whyLead: "DeVoice 服务创作者、教育者、营销人员和日常用户，提供真实自然的 AI 文本转语音工具，无需复杂设置或高昂成本即可生成富有表现力的语音。",
    faqTitle: "文本转语音常见问题",
    cta: "立即开始转换 ->",
    ctaTitle: "立即将文本转换成语音",
    ctaBody: "使用 DeVoice AI 文本转语音，让文字开口说话。",
    guideKicker: "使用指南",
    featureKicker: "核心功能"
  },
  "ai-voice-generator": {
    title: "免费在线 AI 语音生成器",
    description: "从文本生成逼真的 AI 语音，适用于视频、播客、演示和内容制作。",
    featureEyebrow: "核心功能",
    featureTitle: "不可错过的 AI 语音生成使用场景",
    guideTitle: "如何用 DeVoice 三步生成 AI 语音",
    guideIntro: "只需三步即可把文字转换成自然语音。",
    whyTitle: "为什么使用 DeVoice AI 语音生成器？",
    faqTitle: "AI 语音生成常见问题",
    cta: "生成 AI 语音",
    ctaTitle: "立即生成自然 AI 语音",
    ctaBody: "使用 DeVoice AI 语音工具为你的内容生成逼真旁白。",
    guideKicker: "使用指南",
    featureKicker: "核心功能"
  },
  "ai-music-generator": {
    title: "在线 AI 音乐生成器",
    description: "通过提示词生成原创 AI 音乐预览，适用于视频、演示、广告和创意草稿。",
    featureEyebrow: "AI 音乐功能",
    featureTitle: "为真实内容工作流创建音乐创意",
    guideTitle: "如何用 DeVoice 生成 AI 音乐",
    guideIntro: "描述情绪、风格和乐器，然后生成可下载的音乐预览。",
    whyTitle: "为什么使用 DeVoice AI 音乐生成器？",
    faqTitle: "AI 音乐生成器常见问题",
    cta: "生成 AI 音乐",
    ctaTitle: "在线创建 AI 音乐",
    ctaBody: "描述你的创意并生成可下载的 AI 音乐预览。",
    guideKicker: "使用指南",
    featureKicker: "AI 音乐功能"
  },
  "ai-rap-generator": {
    title: "在线 AI Rap 生成器",
    description: "根据提示词、风格和歌词想法生成 Rap 音频预览。",
    featureEyebrow: "AI Rap 功能",
    featureTitle: "为音乐和内容创意创建 Rap 草稿",
    guideTitle: "如何用 DeVoice 生成 AI Rap",
    guideIntro: "描述 Rap 想法，选择风格，然后生成可下载的 Rap 预览。",
    whyTitle: "为什么使用 DeVoice AI Rap 生成器？",
    faqTitle: "AI Rap 生成器常见问题",
    cta: "生成 AI Rap",
    ctaTitle: "在线创建 AI Rap",
    ctaBody: "描述 Rap 想法，选择风格，并生成可下载预览。",
    guideKicker: "使用指南",
    featureKicker: "AI Rap 功能"
  },
  "ai-rap-lyrics-generator": {
    title: "在线 AI Rap 歌词生成器",
    description: "根据主题、情绪、押韵风格和故事想法生成结构化 Rap 歌词。",
    featureEyebrow: "Rap 歌词功能",
    featureTitle: "为草稿、Hook 和创意概念写 Rap 歌词",
    guideTitle: "如何用 DeVoice 生成 Rap 歌词",
    guideIntro: "描述主题和风格，然后生成主歌、副歌和创作摘要。",
    whyTitle: "为什么使用 DeVoice AI Rap 歌词生成器？",
    faqTitle: "AI Rap 歌词生成器常见问题",
    cta: "生成 Rap 歌词",
    ctaTitle: "在线创建 Rap 歌词",
    ctaBody: "描述主题并生成可编辑、可导出的结构化 Rap 歌词。",
    guideKicker: "使用指南",
    featureKicker: "Rap 歌词功能"
  },
  "ai-voice-actors": {
    title: "在线 AI 配音演员",
    description: "选择 AI 配音演员，将文本生成自然的角色旁白和配音。",
    featureEyebrow: "AI 配音演员功能",
    featureTitle: "为真实内容工作流创建 AI 配音",
    guideTitle: "如何用 DeVoice 使用 AI 配音演员",
    guideIntro: "选择声音风格，输入脚本，预览声音，并下载生成的音频。",
    guide: [
      ["01", "输入或粘贴脚本", "输入对白、旁白、广告、课程文案或角色台词。"],
      ["02", "选择 AI 配音演员", "选择语言和声音风格，预览精选声音，并匹配你的内容语气。"],
      ["03", "生成并下载音频", "在线生成自然配音，然后下载 MP3 或 WAV，用于视频、游戏、播客和演示。"]
    ],
    useCases: [
      ["为视频和游戏生成角色对白", "角色", "无需录音设备，也能为讲解、短视频、原型、游戏和互动故事草稿生成角色台词。"],
      ["为课程和演示生成旁白", "旁白", "将脚本转换成稳定一致的课程、培训、产品演示和幻灯片旁白。"],
      ["快速测试营销配音风格", "营销", "为广告、社交短片和活动变体尝试不同 AI 配音演员，再进入最终制作。"],
      ["为创意草稿快速生成配音", "草稿", "在写作、剪辑和迭代创意时快速创建临时或最终旁白。"]
    ],
    why: [
      ["16 种 AI 配音演员风格", "从多种男性、女性和多语言声音风格中选择，适配不同内容需求。"],
      ["即时声音预览", "生成前即可预览配音演员声音，帮助你选择适合脚本的声音。"],
      ["支持 MP3 和 WAV 导出", "下载 MP3 便于分享，或下载 WAV 用于后续编辑制作。"],
      ["跨设备在线使用", "无需安装录音或剪辑软件，直接在浏览器中生成 AI 配音。"],
      ["支持多语言配音", "通过同一流程使用多种语言和地区声音选项。"],
      ["保留私有资源记录", "生成的配音任务会保存在 DeVoice 资源中，方便之后查看和下载。"]
    ],
    whyTitle: "为什么使用 DeVoice AI 配音演员？",
    faqTitle: "AI 配音演员常见问题",
    cta: "生成 AI 配音",
    ctaTitle: "在线创建 AI 配音",
    ctaBody: "选择 AI 配音演员，将脚本转换为可下载的旁白音频。",
    guideKicker: "使用指南",
    featureKicker: "AI 配音演员功能"
  },
  "ai-dubbing": {
    title: "在线 AI 配音",
    description: "从脚本生成 AI 配音旁白，适用于视频、课程、广告和多语言内容。",
    featureEyebrow: "AI 配音功能",
    featureTitle: "为真实视频工作流创建配音轨道",
    guideTitle: "如何用 DeVoice 创建 AI 配音",
    guideIntro: "粘贴脚本，选择语言和声音风格，然后生成可下载的配音音频。",
    guide: [
      ["01", "粘贴配音脚本", "输入翻译对白、旁白、字幕或视频文案，准备生成配音轨道。"],
      ["02", "选择语言和声音", "选择声音语言和演员风格，匹配说话人、品牌或角色语气。"],
      ["03", "生成并下载配音", "创建清晰的 AI 配音预览，然后导出 MP3 或 WAV 用于视频剪辑。"]
    ],
    useCases: [
      ["为新受众本地化视频", "本地化", "将翻译脚本转换为自然配音音频，用于 YouTube 视频、课程、产品演示和社交短片。"],
      ["制作课程和培训旁白", "教育", "为课程、入职视频和内部培训资产生成稳定的多语言旁白。"],
      ["快速测试广告活动版本", "营销", "为广告、产品发布和短视频活动尝试多种语言和声音风格。"],
      ["快速创建角色对白", "角色", "无需录音即可为游戏、动画、分镜和创意原型生成对白轨道。"]
    ],
    why: [
      ["脚本到配音工作流", "无需录音设备，即可把翻译脚本转换为可下载的配音音频。"],
      ["多语言声音选择", "从多种语言和地区声音选项中选择，适配目标受众。"],
      ["控制配音演员风格", "生成前预览并选择源站风格声音。"],
      ["支持 MP3 和 WAV 导出", "下载 MP3 便于分享，或下载 WAV 用于编辑流程。"],
      ["保留私有资源记录", "配音任务会保存在 DeVoice 资源中，方便回看、试听和导出。"],
      ["浏览器在线使用", "无需安装软件，在桌面和移动浏览器中创建 AI 配音。"]
    ],
    whyTitle: "为什么使用 DeVoice AI 配音？",
    faqTitle: "AI 配音常见问题",
    cta: "生成 AI 配音",
    ctaTitle: "在线创建 AI 配音",
    ctaBody: "粘贴脚本，选择声音，并生成可下载的 AI 配音音频。",
    guideKicker: "使用指南",
    featureKicker: "AI 配音功能"
  },
  "ai-voice-cloning": {
    title: "免费在线 AI 声音克隆",
    description: "通过一小段音频样本克隆自然逼真的声音。",
    featureEyebrow: "核心优势",
    featureTitle: "看看 AI 声音克隆如何改变内容、产品和声音制作",
    guideTitle: "如何用 DeVoice 三步完成 AI 声音克隆",
    guideIntro: "只需几个步骤即可创建克隆声音。",
    whyTitle: "为什么选择 DeVoice AI 声音克隆？",
    faqTitle: "AI 声音克隆常见问题",
    cta: "立即开始声音克隆",
    ctaTitle: "无需重新录音，也能创建逼真声音",
    ctaBody: "立即体验 DeVoice AI 声音克隆的强大能力。",
    guideKicker: "使用指南",
    featureKicker: "核心优势"
  },
  "ai-voice-enhancer-isolate": {
    title: "AI 人声增强与隔离",
    description: "在线增强人声录音、隔离语音，并下载更清晰的音频。",
    featureEyebrow: "人声增强功能",
    featureTitle: "为更清晰的内容增强并隔离人声",
    guideTitle: "如何在线增强并隔离人声",
    guideIntro: "上传音频或视频，让 AI 隔离人声，然后在线试听并下载增强结果。",
    guide: [
      ["01", "上传人声音频或视频", "选择录音、采访、会议、播客或含有人声的视频文件。"],
      ["02", "AI 隔离并增强人声", "DeVoice 会从背景环境中分离语音，减少干扰并生成更清晰的人声轨道。"],
      ["03", "试听并下载增强音频", "在线试听结果，然后下载 MP3 或 WAV，用于剪辑、发布或转写。"]
    ],
    useCases: [
      ["让视频对白更清晰", "创作者", "提升 vlog、教程和采访中的语音清晰度，让观众更专注于人声内容。"],
      ["改善会议、课程和通话录音", "会议", "在分享或转写之前，处理房间噪音、键盘声或麦克风较弱的录音。"],
      ["清理播客和旁白轨道", "制作", "无需复杂音频软件，也能为播客、旁白和社交短片准备更干净的人声。"]
    ],
    why: [
      ["一键隔离人声", "上传文件后，DeVoice 会自动从背景环境中分离人声。"],
      ["提升语音清晰度", "通过清理、响度标准化和导出处理，让人声更适合后续使用。"],
      ["支持 MP3 和 WAV 导出", "下载便于分享的 MP3，或适合编辑制作的 WAV。"],
      ["在线跨设备使用", "直接在桌面或移动浏览器中使用，无需安装软件。"]
    ],
    whyTitle: "为什么使用 DeVoice AI 人声增强？",
    faqTitle: "AI 人声增强常见问题",
    cta: "立即增强人声",
    ctaTitle: "在线增强并隔离人声",
    ctaBody: "上传嘈杂的人声录音，生成更清晰的可下载音频。",
    guideKicker: "使用指南",
    featureKicker: "人声增强"
  },
  "ai-voice-changer": {
    title: "在线 AI 变声器",
    description: "上传人声音频或视频，在线生成 AI 变声预览。",
    featureEyebrow: "AI 变声功能",
    featureTitle: "为创意音频和视频转换声音",
    guideTitle: "如何在线使用 AI 变声器",
    guideIntro: "上传人声录音，让 DeVoice 处理语音，然后试听并下载变声结果。",
    guide: [
      ["01", "上传人声音频或视频", "选择录音、对白、播客片段或含有人声的视频文件。"],
      ["02", "AI 处理声音", "DeVoice 会分析语音节奏和音色轮廓，隔离人声并生成变声预览。"],
      ["03", "试听并下载", "在线试听，然后下载 MP3 或 WAV，用于剪辑、社交内容、演示或创意草稿。"]
    ],
    useCases: [
      ["为短视频创建角色声音", "创作者", "将普通录音转换成角色风格的声音预览，适合短视频、段子、讲解和社交内容。"],
      ["不用重录也能尝试旁白方向", "制作", "在正式录音前快速尝试不同声音风格，帮助确定最终方向。"],
      ["快速完成音频实验", "创意", "直接在浏览器中处理对白、旁白和语音备忘录，无需复杂音频软件。"]
    ],
    why: [
      ["一键 AI 变声", "上传人声文件，DeVoice 会用简单浏览器流程生成变声预览。"],
      ["支持 MP3 和 WAV 下载", "MP3 适合轻量分享，WAV 适合后续编辑制作。"],
      ["兼容音频和视频", "上传常见音频或视频文件，并处理其中的语音轨道。"],
      ["保留私有资源记录", "变声结果会保存在 DeVoice 资源中，方便之后返回下载。"]
    ],
    whyTitle: "为什么使用 DeVoice AI 变声器？",
    faqTitle: "AI 变声器常见问题",
    cta: "立即变声",
    ctaTitle: "在线转换声音",
    ctaBody: "上传人声录音，生成可下载的 AI 变声预览。",
    guideKicker: "使用指南",
    featureKicker: "AI 变声"
  },
  "audio-extract-from-video": {
    title: "视频音频提取器",
    description: "在线从视频中提取音频，并下载 MP3 或 WAV 文件。",
    featureEyebrow: "视频转音频功能",
    featureTitle: "适用于各种流程的视频音频提取",
    guideTitle: "如何在线从视频中提取音频",
    guideIntro: "上传视频，DeVoice 会提取音轨并生成可下载音频。",
    guide: [
      ["01", "上传视频文件", "选择 MP4、MOV、WEBM、MKV 或其它常见视频文件，并直接在浏览器中上传。"],
      ["02", "提取音频轨道", "DeVoice 会读取视频，检测其中的音频流，并为导出做好准备。"],
      ["03", "下载 MP3 或 WAV", "在线试听提取后的音频，然后下载便于分享的 MP3 或适合编辑的 WAV。"]
    ],
    useCases: [
      ["将视频采访变成音频素材", "采访", "从录制采访中提取清晰音频，用于播客剪辑、转写或内容归档。"],
      ["复用视频中的声音素材", "创作者", "从视频文件中提取旁白、配乐或片段，并用于短视频、课程和社交内容。"],
      ["为转写和字幕准备音频", "转写", "先把视频转换为音频素材，再进入转写、字幕或摘要流程。"]
    ],
    why: [
      ["快速在线提取音频", "无需安装剪辑软件，也不用从桌面时间线手动导出。"],
      ["支持 MP3 和 WAV 下载", "MP3 适合轻量分享，WAV 适合后续编辑和制作。"],
      ["兼容常见视频格式", "支持上传 MP4、MOV、WEBM、MKV 等浏览器常见视频文件。"],
      ["保留私有资源记录", "提取记录会保存在 DeVoice 资源中，方便之后返回下载。"]
    ],
    whyTitle: "为什么使用 DeVoice 音频提取器？",
    faqTitle: "音频提取常见问题",
    cta: "从视频提取音频",
    ctaTitle: "在线从视频中提取音频",
    ctaBody: "上传视频，将其中音轨转换为可下载的 MP3 或 WAV。",
    guideKicker: "使用指南",
    featureKicker: "视频转音频"
  },
  "youtube-transcript-generator": {
    title: "免费 YouTube 文稿生成器",
    description: "粘贴链接、选择语言，几秒内获得可阅读的 YouTube 文稿。",
    featureEyebrow: "YouTube 文稿功能",
    featureTitle: "我们的 YouTube 文稿生成器如何帮助你",
    guideTitle: "如何三步使用 DeVoice YouTube 文稿生成器",
    guideIntro: "粘贴公开视频链接，DeVoice 会将其中语音转换成可阅读文本。",
    whyTitle: "为什么用户选择 DeVoice 生成 YouTube 文稿？",
    faqTitle: "常见问题",
    cta: "免费获取 YouTube 文稿",
    ctaTitle: "立即将任意 YouTube 视频转换成文字",
    ctaBody: "粘贴 YouTube 链接，快速、准确、轻松地将视频转换为文字。",
    featureKicker: "YouTube 文稿功能"
  },
  "youtube-subtitle-downloader": {
    title: "免费 YouTube 字幕下载器",
    description: "在线下载任意语言的 YouTube 字幕，快速、准确、无需注册。",
    featureEyebrow: "YouTube 字幕功能",
    featureTitle: "DeVoice YouTube 字幕下载器的强大功能",
    guideTitle: "如何三步使用 YouTube 字幕下载器",
    guideIntro: "粘贴 YouTube 链接，获取可用字幕并下载所需格式。",
    faqTitle: "常见问题",
    cta: "免费试用",
    ctaTitle: "几秒内下载 YouTube 字幕",
    ctaBody: "使用 DeVoice YouTube 字幕下载器将视频转换成可阅读字幕。",
    featureKicker: "YouTube 字幕下载功能"
  },
  "youtube-video-summarizer": {
    title: "AI YouTube 视频总结器",
    description: "复制并粘贴 YouTube 视频链接，用 AI 快速提取重点。",
    featureEyebrow: "YouTube 视频总结功能",
    featureTitle: "DeVoice AI YouTube 视频总结器的强大功能",
    guideTitle: "如何三步使用 YouTube 视频总结器",
    guideIntro: "按照简单步骤，从任意 YouTube 视频生成 AI 摘要。",
    whyTitle: "为什么选择 DeVoice AI YouTube 视频总结器？",
    faqTitle: "常见问题",
    cta: "立即生成 AI 摘要",
    ctaTitle: "马上开始总结 YouTube 视频",
    ctaBody: "不再花数小时看完整视频，使用 DeVoice 在线快速获取智能摘要。",
    featureKicker: "YouTube 视频总结功能"
  }
};

export function getLocalizedToolConfig(config: ToolConfig, locale: Locale): ToolConfig {
  const override = locale === "zh-cn" ? zhCnToolOverrides[config.slug] : undefined;
  return override ? { ...config, ...override, slug: config.slug, kind: config.kind } : config;
}

function defaultJobTypeForSlug(slug: DeVoiceToolSlug): DeVoiceJobType {
  if (slug === "audio-to-text") return "audio_to_text";
  if (slug === "video-to-text") return "video_to_text";
  if (slug === "youtube-subtitle-downloader") return "youtube_subtitle";
  if (slug === "youtube-video-summarizer") return "youtube_summary";
  if (slug === "youtube-transcript-generator") return "youtube_transcript";
  if (slug === "transcribe-youtube-videos") return "speech_to_text";
  if (slug === "remove-background-noise" || slug === "ai-noise-filter") return "remove_noise";
  if (slug === "ai-voice-enhancer-isolate") return "voice_enhance";
  if (slug === "ai-voice-changer") return "voice_change";
  if (slug === "audio-extract-from-video") return "audio_extract";
  if (slug === "ai-dubbing") return "ai_dubbing";
  if (slug === "ai-music-generator") return "ai_music";
  if (slug === "ai-rap-generator") return "ai_rap";
  if (slug === "ai-rap-lyrics-generator") return "rap_lyrics";
  if (slug === "text-to-speech" || slug === "ai-voice-generator" || slug === "ai-voice-actors") return "text_to_speech";
  if (slug === "ai-voice-cloning") return "voice_clone";
  return "speech_to_text";
}

function HeroTitle({ slug, title }: { slug: DeVoiceToolSlug; title: string }) {
  if (slug === "ai-music-generator" && title.startsWith("AI Music Generator ")) {
    return (
      <>
        <span className="musicTitleAccent">AI Music Generator</span> That Turns Ideas into
        <br className="musicTitleMobileBreak" /> Songs in Seconds
      </>
    );
  }

  if (slug === "ai-dubbing" && title === "Free Video & Audio Dubbing AI: Localize Videos in 100+ Languages") {
    return (
      <>
        Free Video & Audio
        <br className="dubbingTitleMobileBreak" /> Dubbing AI: Localize
        <br className="dubbingTitleMobileBreak" /> Videos in 100+ Languages
      </>
    );
  }

  if (slug === "ai-rap-generator" && title.startsWith("Royalty-Free ")) {
    return (
      <>
        <span className="rapTitleAccent">Royalty-Free</span> {title.slice("Royalty-Free ".length)}
      </>
    );
  }

  if (slug === "ai-rap-lyrics-generator" && title.includes("AI Rap Lyrics Generator")) {
    const [before, after = ""] = title.split("AI Rap Lyrics Generator");
    return (
      <>
        {before}
        <span className="rapLyricsTitleAccent">AI Rap Lyrics Generator</span>
        {after}
      </>
    );
  }

  return title;
}

export function DeVoiceToolPage({ config: rawConfig, locale }: { config: ToolConfig; locale: Locale }) {
  const config = getLocalizedToolConfig(rawConfig, locale);
  const dict = getDictionary(locale);
  const heroTitle = config.slug === "home" || config.slug === "ai-speech-to-text" ? config.title || dict.hero.title : config.title;
  const heroDescription = config.slug === "home" || config.slug === "ai-speech-to-text" ? config.description || dict.hero.description : config.description;
  const href = (path = "") => localizedPath(locale, path);
  const guide = <GuideSection config={config} />;
  const benefits = <BenefitSection config={config} locale={locale} />;
  const why = <WhySection config={config} locale={locale} />;
  const guideFirst = config.sectionOrder === "guide-first";
  const whyFirst = config.sectionOrder === "why-first";
  const benefitsFirst = config.transcriberSectionOrder === "benefits-why-guide";
  const showHeroDiscoverySections =
    !config.compactToolPage ||
    config.slug === "ai-speech-to-text" ||
    config.slug === "audio-to-text" ||
    config.slug === "video-to-text";
  const showLowerDiscoverySections = !config.compactToolPage && !config.hideGenericDiscoverySections;
  const standaloneCta = isPriorityVoiceSlug(config.slug);

  const heroClassName =
    (config.slug === "home" || config.slug === "ai-speech-to-text"
        ? "toolHero homeToolHero"
        : config.kind === "noise" || config.kind === "voice-enhance" || config.kind === "audio-extract"
          ? "toolHero noiseToolHero"
          : config.kind === "youtube"
            ? "toolHero youtubeToolHero"
            : config.kind === "speech" || config.kind === "dubbing" || config.kind === "clone" || config.kind === "voice-change"
              ? "toolHero voiceToolHero"
          : "toolHero") + ` toolSlug-${config.slug}` + (isPriorityVoiceSlug(config.slug) ? " priorityVoiceToolHero" : "");

  return (
    <>
      <section className={heroClassName} id="try">
        <div className="heroHeading">
          <h1><HeroTitle slug={config.slug} title={heroTitle} /></h1>
          <p>{heroDescription}</p>
        </div>
        {config.kind === "speech" || config.kind === "dubbing" || config.kind === "clone" || config.kind === "voice-change" ? (
          <DeVoiceVoicePanel
            kind={config.kind === "clone" ? "clone" : "speech"}
            cta={config.cta}
            locale={locale}
            sourceType={config.kind === "dubbing" ? "ai_dubbing" : config.kind === "voice-change" ? "voice_change" : undefined}
          />
        ) : config.kind === "music" || config.kind === "rap" || config.kind === "lyrics" ? (
          <PromptGenerationPanel
            cta={config.cta}
            locale={locale}
            sourceType={config.kind === "music" ? "ai_music" : config.kind === "rap" ? "ai_rap" : "rap_lyrics"}
          />
        ) : config.kind === "noise" ? (
          <NoiseUploadPanel cta={config.cta} locale={locale} />
        ) : config.kind === "voice-enhance" ? (
          <VoiceEnhancePanel cta={config.cta} locale={locale} />
        ) : config.kind === "audio-extract" ? (
          <AudioExtractPanel config={config} locale={locale} />
        ) : (
          <TranscriptionToolPanel config={config} locale={locale} />
        )}
        {showHeroDiscoverySections ? (
          <>
            <ExampleStrip locale={locale} sourceType={defaultJobTypeForSlug(config.slug)} />
            <RecommendedTools locale={locale} />
          </>
        ) : null}
      </section>

      {config.customContentOrder === "ai-noise-filter" ? (
        <>
          {benefits}
          {guide}
          {why}
          <AiNoiseFilterUseCases />
        </>
      ) : config.customContentOrder === "remove-background-noise" ? (
        <>
          {why}
          {guide}
          <BenefitSection config={{ ...config, featureTitle: config.customUseCaseTitle ?? config.featureTitle }} locale={locale} />
        </>
      ) : (
        <>
          {whyFirst ? why : benefitsFirst ? benefits : guideFirst ? guide : benefits}
          {whyFirst ? guide : benefitsFirst ? null : guideFirst ? benefits : guide}
          {whyFirst ? benefits : why}

          {benefitsFirst ? guide : null}
        </>
      )}


      {config.kind === "clone" ? <VoiceCloneTestimonials locale={locale} /> : null}
      {config.testimonials ? (
        <Testimonials
          title={config.testimonialTitle ?? (locale === "zh-cn" ? "用户怎么说" : "What Users Are Saying")}
          kicker={config.testimonialKicker}
          testimonials={config.testimonials}
          locale={locale}
        />
      ) : null}

      <GeneratorRecommendedTools config={config} locale={locale} />
      <RapLyricsUseCases config={config} />

      {showLowerDiscoverySections ? (
        <section className="contentSection" id="tools">
          <h2>{locale === "zh-cn" ? "语音转文字工具与 AI 转写功能" : "Speech to Text Tools & AI Transcription Features"}</h2>
          <p className="sectionLead">
            {locale === "zh-cn"
              ? "探索更多 AI 转写和语音工具，帮助你更快、更准确地将语音转换成文字。"
              : "Explore more AI-powered transcription and speech tools designed to help you convert speech to text faster and more accurately."}
          </p>
          <ToolFeatureCarousel
            items={[
              {
                title: locale === "zh-cn" ? "YouTube 文稿生成器" : "YouTube Transcript Generator",
                description: locale === "zh-cn" ? "立即生成准确的 YouTube 文稿和 AI 摘要，把视频语音转换成可搜索文本。" : "Generate accurate YouTube transcripts and AI-powered summaries instantly. Convert video speech into searchable text for research, learning, and content creation.",
                href: href("youtube-transcript-generator"),
                cta: locale === "zh-cn" ? "生成 YouTube 文稿" : "Generate YouTube Transcript",
                icon: "youtube"
              },
              {
                title: locale === "zh-cn" ? "音频转文字转换器" : "Audio to Text Converter",
                description: locale === "zh-cn" ? "使用 AI 语音识别在线将音频和视频转换成准确文本，适合播客、会议和采访。" : "Convert audio and video files into accurate text online using advanced AI speech recognition technology. Perfect for podcasts, meetings, and interviews.",
                href: href("audio-to-text"),
                cta: locale === "zh-cn" ? "转换音频为文字" : "Convert Audio to Text",
                icon: "audio"
              },
              {
                title: locale === "zh-cn" ? "视频转文字转换器" : "Video to Text Converter",
                description: locale === "zh-cn" ? "自动转写视频语音，几秒内生成字幕、文章、笔记或可搜索文稿。" : "Transcribe video to text automatically and turn spoken content into subtitles, articles, notes, or searchable transcripts in seconds.",
                href: href("video-to-text"),
                cta: locale === "zh-cn" ? "转换视频为文字" : "Convert Video to Text",
                icon: "video"
              },
              {
                title: locale === "zh-cn" ? "去除背景噪音" : "Remove Background Noise",
                description: locale === "zh-cn" ? "清理嘈杂录音并提升语音清晰度，让转写结果更准确。" : "Clean noisy recordings and improve speech clarity before transcription for more accurate speech-to-text results.",
                href: href("remove-background-noise"),
                cta: locale === "zh-cn" ? "去除背景噪音" : "Remove Background Noise",
                icon: "noise"
              },
              {
                title: locale === "zh-cn" ? "AI 语音生成器" : "AI Voice Generator",
                description: locale === "zh-cn" ? "从文本生成逼真的 AI 语音，适用于视频、播客、演示和内容制作。" : "Generate realistic AI voices from text for videos, podcasts, presentations, and content production.",
                href: href("ai-voice-generator"),
                cta: locale === "zh-cn" ? "生成 AI 语音" : "Generate AI Voice",
                icon: "voice"
              }
            ]}
          />
        </section>
      ) : null}

      {showLowerDiscoverySections ? (
        <section className="contentSection softBand" id="pricing">
          <span className="sectionKicker">{locale === "zh-cn" ? "积分" : "Credits"}</span>
          <h2>{locale === "zh-cn" ? "适用于每个音视频流程的简单积分" : "Simple credits for every audio and video workflow"}</h2>
          <div className="creditGrid">
            {(locale === "zh-cn" ? [
              ["免费", "每日 10 积分", "试用转写、示例和短媒体片段。"],
              ["创作者", "5,000 积分", "批量处理音频、视频、YouTube 文稿和摘要。"],
              ["工作室", "不限量", "适合高频语音和转写工作流。"]
            ] : [
              ["Free", "10 daily credits", "Try transcription, examples and short media clips."],
              ["Creator", "5,000 credits", "Batch audio, video, YouTube transcripts and summaries."],
              ["Studio", "Unlimited", "High-volume voice and transcription workflows."]
            ]).map(([name, price, text]) => (
              <article key={name}>
                <Sparkles size={24} aria-hidden="true" />
                <h3>{name}</h3>
                <strong>{price}</strong>
                <p>{text}</p>
                <a className="mintButton" href={href("pricing")}>{locale === "zh-cn" ? "立即领取" : "Claim Now"}</a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={standaloneCta ? "contentSection faqSection priorityVoiceFaqSection" : "contentSection faqSection"} id="faq">
        <h2>{config.faqTitle}</h2>
        {faqIntroFor(config, locale) ? <p className="sectionLead">{faqIntroFor(config, locale)}</p> : null}
        <div className={standaloneCta ? "faqList priorityVoiceFaqList" : "faqList"}>
          {faqFor(config).map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        {standaloneCta ? null : <FinalCta config={config} locale={locale} />}
      </section>

      {standaloneCta ? (
        <section className="contentSection ctaSection">
          <FinalCta config={config} locale={locale} />
        </section>
      ) : null}

      <DeVoiceFooter locale={locale} />
    </>
  );
}

function FinalCta({ config, locale }: { config: ToolConfig; locale: Locale }) {
  return (
    <div className="ctaBand">
      <PlayCircle size={42} aria-hidden="true" />
      <h2>{config.ctaTitle ?? config.cta}</h2>
      <p>{config.ctaBody ?? (locale === "zh-cn" ? "开始使用 DeVoice，用 AI 快速处理音频和视频。" : "Start using DeVoice to process audio and video with fast AI-powered tools.")}</p>
      <a className="mintButton" href="#try">{config.ctaButton ?? config.cta}</a>
    </div>
  );
}

function RapLyricsUseCases({ config }: { config: ToolConfig }) {
  if (config.slug !== "ai-rap-lyrics-generator") return null;

  const cases = [
    {
      label: "Rappers",
      title: "Rappers Seeking Inspiration",
      description:
        "Even the most talented rappers run into creative roadblocks — that’s where our AI rap lyrics generator becomes your secret weapon. Just type in a theme or emotion, and you’ll instantly get fresh, rhymed content that fits your style. Whether you rap old-school, trap, or drill, this AI rap lyrics generator adjusts to your flow. If you want to hear how it sounds, use the text to song feature to generate audio and test your vibe. You can even take those lines and move from lyrics to song in just one click. Never lose momentum again — your next great verse starts here.",
      image: "/assets/ai-rap-lyrics-generator/feature1.webp",
      width: 768,
      height: 529
    },
    {
      label: "Beginners",
      title: "Beginners Learning to Rap",
      description:
        "New to rap? DeVoice’s AI rap lyrics generator makes it easy to start. You don’t need to know how to rhyme or write — just enter a phrase or topic, and the AI will instantly create lyrics for you. This is perfect for beginners who want to understand rhythm, structure, and lyrical themes without the pressure of starting from scratch. Whether you’re trying to freestyle, perform for friends, or just understand how rap works, the AI rap lyrics generator helps you build confidence and learn fast. It’s a fun and effective way to get into rapping.",
      image: "/assets/ai-rap-lyrics-generator/feature2.webp",
      width: 768,
      height: 531
    },
    {
      label: "Musicians",
      title: "Educators & Musicians Teaching with AI",
      description:
        "Music teachers, coaches, and songwriting mentors can now use DeVoice’s AI rap lyrics generator as a powerful classroom tool. It helps demonstrate lyrical structure, rhyme patterns, and creative writing in a way that’s interactive and engaging. Whether you’re teaching in schools, workshops, or online programs, the AI offers real-time lyric generation that supports learning outcomes. Educators can use it to spark discussions, build exercises, or show how different styles evolve. With the AI rap lyrics generator, teaching rap and hip-hop becomes more accessible, scalable, and fun.",
      image: "/assets/ai-rap-lyrics-generator/feature3.webp",
      width: 768,
      height: 527
    },
    {
      label: "Creators",
      title: "Social Media Creators & Influencers",
      description:
        "Looking to boost engagement on TikTok, Instagram, or YouTube? DeVoice’s AI rap lyrics generator helps social media creators craft unique, catchy lyrics in seconds. Whether you’re making parody raps, brand shoutouts, challenge entries, or creative intros, this tool delivers fast, customized bars to match your vibe. No writing skills needed — just input a theme and let the AI handle the rhymes. For content creators aiming to stand out, the AI rap lyrics generator is a game-changer that saves time and fuels creativity with every click.",
      image: "/assets/ai-rap-lyrics-generator/feature4.webp",
      width: 768,
      height: 528
    }
  ];

  return (
    <section className="rapLyricsUseCases">
      <div className="rapLyricsUseCasesInner">
        <span className="sectionKicker">User Cases</span>
        <h2>How DeVoice’s AI Rap Lyrics Generator is Revolutionizing Creativity</h2>
        <div className="rapLyricsCaseGrid">
          {cases.map((item, index) => (
            <article className={index % 2 ? "rapLyricsCaseCard rapLyricsCaseReverse" : "rapLyricsCaseCard"} key={item.title}>
              <div className="rapLyricsCaseMedia">
                <Image src={item.image} alt={item.title} width={item.width} height={item.height} />
              </div>
              <div className="rapLyricsCaseCopy">
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiNoiseFilterUseCases() {
  const cases = [
    {
      label: "Podcasts",
      title: "Clean Up Podcast Audio",
      description: "Use AI Noise Filter to reduce hums, room noise, and background distractions so every voice in a podcast or interview sounds clearer.",
      image: "/assets/remove-background-noise/feature1.webp",
      width: 768,
      height: 791
    },
    {
      label: "Video",
      title: "Improve Video Voice Tracks",
      description: "Clean voice audio from vlogs, tutorials, and social videos without leaving the browser. Keep speech focused and easier to understand.",
      image: "/assets/remove-background-noise/feature2.webp",
      width: 768,
      height: 672
    },
    {
      label: "Music",
      title: "Prepare Tracks for Editing",
      description: "Remove distracting background sounds before remixing, sampling, or exporting cleaner audio for creative projects.",
      image: "/assets/remove-background-noise/feature3.webp",
      width: 768,
      height: 870
    }
  ];

  return (
    <section className="contentSection">
      <span className="sectionKicker">Use Cases</span>
      <h2>Enhance Every Video and Track with AI Noise Filter</h2>
      <div className="benefitStack">
        {cases.map((item, index) => (
          <article className={index % 2 ? "benefitCard benefitReverse" : "benefitCard"} key={item.title}>
            <div className="benefitMedia">
              <Image src={item.image} alt="" width={item.width} height={item.height} />
              <span>{item.label}</span>
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BenefitSection({ config, locale }: { config: ToolConfig; locale: Locale }) {
  return (
    <section className={isPriorityVoiceSlug(config.slug) ? "contentSection priorityVoiceBenefitSection" : "contentSection"}>
      <span className="sectionKicker">{config.featureKicker ?? config.featureEyebrow}</span>
      <h2>{config.featureTitle}</h2>
      <div className="benefitStack">
        {config.useCases.map(([title, label, description], index) => {
          const featureImage = benefitImageSets[config.slug][index] ?? benefitImageSets.home[index] ?? benefitImageSets.home[0];
          return (
            <article className={index % 2 ? "benefitCard benefitReverse" : "benefitCard"} key={title}>
              <div className="benefitMedia">
                <Image
                  src={featureImage.src}
                  alt=""
                  width={featureImage.width}
                  height={featureImage.height}
                  unoptimized={config.slug === "ai-voice-enhancer-isolate" || config.slug === "ai-voice-changer"}
                />
                <span>{label}</span>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
                {hideBenefitAction(config.slug) ? null : <a className="mintButton" href="#try">{benefitAction(config.slug, index, locale)}</a>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WhySection({ config, locale }: { config: ToolConfig; locale: Locale }) {
  if (config.why.length === 0) return null;
  const isClone = config.slug === "ai-voice-cloning";

  return (
    <section className={isClone ? "contentSection softBand cloneWhyBand" : "contentSection softBand"}>
      <div className={isClone ? "cloneWhyIntro" : undefined}>
        <span className="sectionKicker">{whyKicker(config, locale)}</span>
        <h2>{config.whyTitle}</h2>
        {config.whyLead ? <p className="whyLead">{config.whyLead}</p> : null}
      </div>
      <div className="whyGrid">
        {config.why.map(([title, description]) => (
          <article key={title}>
            <BadgeCheck size={22} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function GuideSection({ config }: { config: ToolConfig }) {
  const className = [
    "contentSection",
    "guideBand",
    config.inlineGuideStepLabel ? "inlineGuideStepBand" : null,
    isPriorityVoiceSlug(config.slug) ? "priorityVoiceGuideBand" : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className}>
      <span className="sectionKicker">{config.guideKicker ?? "User Guide"}</span>
      <h2>{config.guideTitle}</h2>
      <p className="sectionLead">{config.guideIntro}</p>
      <div className="guideGrid">
        {config.guide.map(([step, title, description], index) => {
          const guideImage = guideImageSets[config.slug][index] ?? guideImageSets.home[index] ?? guideImageSets.home[0];
          return (
          <article key={step}>
            <div className="guideImage">
              <Image
                src={guideImage.src}
                alt=""
                width={guideImage.width}
                height={guideImage.height}
              />
            </div>
            {config.inlineGuideStepLabel ? null : <strong>{step}</strong>}
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function VoiceCloneTestimonials({ locale }: { locale: Locale }) {
  return (
    <Testimonials
      title={locale === "zh-cn" ? "受到创作者、团队和专业人士信赖" : "Trusted by Creators, Teams, and Professionals"}
      kicker={locale === "zh-cn" ? "用户评价" : "Testimonials & Reviews"}
      testimonials={locale === "zh-cn" ? [
        ["Michael Thompson", "AI 声音克隆质量让我很惊喜。DeVoice 很好地捕捉了语气和情绪。"],
        ["Emily Carter", "没时间录音时，我会用 DeVoice 生成课程音频，听起来自然又稳定。"],
        ["Daniel Rodriguez", "以前修改对白很麻烦，现在用 AI 声音克隆很快就能完成。"],
        ["Sophia Nguyen", "流程很简单，输出真的像真人声音。"],
        ["James Walker", "DeVoice 帮助我们在所有演示中保持一致的品牌声音。"],
        ["Anna Müller", "清晰、逼真、快速，正是我需要的。"]
      ] : [
        ["Michael Thompson", "The AI Voice Cloning quality surprised me. DeVoice captured tone and emotion incredibly well."],
        ["Emily Carter", "I use DeVoice to generate lesson audio when I don't have time to record. It sounds natural and consistent."],
        ["Daniel Rodriguez", "Updating dialogue used to be painful. With AI voice cloning, it's instant."],
        ["Sophia Nguyen", "The workflow is simple and the output actually sounds human."],
        ["James Walker", "DeVoice helps us keep a consistent brand voice across all our demos."],
        ["Anna Müller", "Clear, realistic, and fast. Exactly what I needed."]
      ]}
      locale={locale}
      className="cloneTestimonialsBand"
    />
  );
}

function Testimonials({ title, testimonials, kicker, locale, className }: { title: string; testimonials: Array<[string, string]>; kicker?: string; locale: Locale; className?: string }) {
  return (
    <section className={["contentSection", "testimonialBand", className].filter(Boolean).join(" ")}>
      <span className="sectionKicker">{kicker ?? (locale === "zh-cn" ? "用户反馈" : "User Feedback")}</span>
      <h2>{title}</h2>
      <div className="testimonialGrid">
        {testimonials.map(([name, quote]) => (
          <article key={name}>
            {className === "cloneTestimonialsBand" ? (
              <div className="testimonialStars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} />
                ))}
              </div>
            ) : null}
            <p>&quot;{quote}&quot;</p>
            <strong>{name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function TranscriptionToolPanel({ config, locale }: { config: ToolConfig; locale: Locale }) {
  const isYoutube = config.kind === "youtube";
  const t = getDictionary(locale).tool;
  const defaultJobType = defaultJobTypeForSlug(config.slug);

  return (
    <div className="converterFrame">
      <JobForm
        title={isYoutube ? "Supports YouTube videos, Shorts, podcasts, and audio links." : t.uploadTitle}
        help={isYoutube ? "Paste link" : t.uploadHelp}
        placeholder={isYoutube ? t.pastePlaceholder : "For example: https://www.youtube.com/watch?v=example"}
        buttonLabel={isYoutube ? t.getTranscript : t.uploadFiles}
        locale={locale}
        defaultJobType={defaultJobType}
        youtubeOnly={isYoutube}
        dedicatedTool={config.dedicatedUploadPanel}
      />
    </div>
  );
}

function AudioExtractPanel({ config, locale }: { config: ToolConfig; locale: Locale }) {
  return <NoiseUploadClient cta={config.cta} locale={locale} sourceType="audio_extract" mode="audio-extract" />;
}

function NoiseUploadPanel({ cta, locale }: { cta: string; locale: Locale }) {
  return <NoiseUploadClient cta={cta} locale={locale} />;
}

function VoiceEnhancePanel({ cta, locale }: { cta: string; locale: Locale }) {
  return <NoiseUploadClient cta={cta} locale={locale} sourceType="voice_enhance" mode="voice-enhance" />;
}

function VoiceChangePanel({ cta, locale }: { cta: string; locale: Locale }) {
  return <NoiseUploadClient cta={cta} locale={locale} sourceType="voice_change" mode="voice-change" />;
}

function RecommendedTools({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).tool;
  return (
    <section className="recommendedTools" aria-labelledby="recommended-title">
      <h3 id="recommended-title">{t.recommendedTools}</h3>
      <div>
        {recommended.map(([title, description, slug, Icon]) => (
          <a href={localizedPath(locale, slug)} key={title}>
            <Icon size={24} aria-hidden="true" />
            <strong>{title}</strong>
            <small>{description}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function GeneratorRecommendedTools({ config, locale }: { config: ToolConfig; locale: Locale }) {
  if (config.slug !== "ai-rap-generator" && config.slug !== "ai-rap-lyrics-generator") return null;

  const href = (path = "") => localizedPath(locale, path);
  const isLyrics = config.slug === "ai-rap-lyrics-generator";
  const items = isLyrics ? [
    {
      title: "AI Rap Generator",
      description: "Create rap music from your lyric ideas with AI-generated beats, vocals, and downloadable previews.",
      href: href("ai-rap-generator"),
      cta: "Create Rap Music with AI Rap Generator Now ->",
      icon: Music2
    },
    {
      title: "AI Vocal Remover",
      description: "Create cleaner source audio for practice, sampling, and production workflows.",
      href: href("remove-background-noise"),
      cta: "Create Pure Audio with AI Vocal Remover Now ->",
      icon: Headphones
    },
    {
      title: "AI Noise Filter",
      description: "Remove background noise before writing, recording, or turning ideas into songs.",
      href: href("ai-noise-filter"),
      cta: "Removing Background Using AI Vocal Remover Now ->",
      icon: Sparkles
    },
    {
      title: "AI Voice Actors",
      description: "Turn lyrics, hooks, or scripts into AI voice audio for demos and creative drafts.",
      href: href("ai-voice-actors"),
      cta: "Turning Text to Speech Using AI Voice Actors Now ->",
      icon: MicVocal
    }
  ] : [
    {
      title: "AI Rap Lyrics Generator",
      description: "Transform topics and keywords into rap lyrics, hooks, verses, and editable song ideas.",
      href: href("ai-rap-lyrics-generator"),
      cta: "Creating Lyrics Using AI Rap Lyrics Generator Now ->",
      icon: Brain
    },
    {
      title: "AI Vocal Remover",
      description: "Create clean backing tracks and clearer audio sources for rap production workflows.",
      href: href("remove-background-noise"),
      cta: "Creating Pure Audio Using AI Vocal Remover Now ->",
      icon: Headphones
    },
    {
      title: "AI Noise Filter",
      description: "Remove background noise from recordings before using them in AI rap drafts.",
      href: href("ai-noise-filter"),
      cta: "Removing Background Using AI Vocal Remover Now ->",
      icon: Sparkles
    },
    {
      title: "AI Voice Actors",
      description: "Turn written rap lines or scripts into spoken voice previews for creative demos.",
      href: href("ai-voice-actors"),
      cta: "Turning Text to Speech Using AI Voice Actors Now ->",
      icon: MicVocal
    }
  ];

  return (
    <section className="contentSection generatorToolsSection">
      <span className="sectionKicker">Our Services</span>
      <h2>{isLyrics ? "AI Rap Lyrics Generator Services" : "AI Rap Generator Services"}</h2>
      <div className="generatorToolGrid">
        {items.map(({ title, description, href: itemHref, cta, icon: Icon }) => (
          <article key={title}>
            <Icon size={24} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
            <a className="mintButton" href={itemHref}>{cta}</a>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExampleStrip({ locale, sourceType }: { locale: Locale; sourceType: DeVoiceJobType }) {
  const t = getDictionary(locale).tool;
  return <DeVoiceExamples examples={examples} locale={locale} label={t.examples} sourceType={sourceType} />;
}

function benefitAction(slug: DeVoiceToolSlug, index: number, locale: Locale) {
  if (locale === "zh-cn") {
    if (slug === "home" || slug === "ai-speech-to-text") {
      return ["提升会议效率", "更快复用内容", "提升内容可访问性"][index] ?? "立即转写语音";
    }
  if (slug === "youtube-video-summarizer") {
    return "总结视频";
  }
  if (slug === "ai-dubbing") {
    return "生成 AI 配音";
  }
  return slug === "remove-background-noise" ? "去除音频噪音" : "立即开始转换";
  }
  if (slug === "home" || slug === "ai-speech-to-text") {
    return ["Improve Meeting Productivity", "Repurpose Content Faster", "Make Content More Accessible"][index] ?? "Convert Speech to Text Now";
  }
  if (slug === "youtube-video-summarizer") {
    return "Summarize Video";
  }
  if (slug === "youtube-transcript-generator") {
    return "Generate Transcript";
  }
  if (slug === "youtube-subtitle-downloader") {
    return "Download Subtitles";
  }
  if (slug === "transcribe-youtube-videos") {
    return ["Transcribe Now", "Generate Now", "Export Now"][index] ?? "Transcribe Now";
  }
  if (slug === "ai-dubbing") {
    return "Generate AI dubbing";
  }
  return slug === "remove-background-noise" ? "Remove Noise from Audio" : "Start converting now";
}

function hideBenefitAction(slug: DeVoiceToolSlug) {
  return (
    slug === "audio-extract-from-video" ||
    slug === "ai-voice-enhancer-isolate" ||
    slug === "ai-voice-changer" ||
    slug === "ai-dubbing" ||
    slug === "ai-noise-filter" ||
    slug === "remove-background-noise" ||
    slug === "text-to-speech" ||
    slug === "ai-voice-generator" ||
    slug === "ai-voice-actors" ||
    slug === "ai-voice-cloning"
  );
}

function isPriorityVoiceSlug(slug: DeVoiceToolSlug) {
  return (
    slug === "text-to-speech" ||
    slug === "ai-voice-generator" ||
    slug === "ai-voice-actors" ||
    slug === "ai-voice-cloning"
  );
}

function whyKicker(config: ToolConfig, locale: Locale) {
  if (locale === "zh-cn") {
    if (config.kind === "speech" || config.kind === "dubbing") return "我们的优势";
    if (config.kind === "clone") return "为什么选择 DeVoice";
    if (config.kind === "noise") return "功能亮点";
    if (config.kind === "voice-change" || config.kind === "voice-enhance") return "为什么选择 DeVoice";
    if (config.kind === "youtube") return "为什么选择 DeVoice";
    return "为什么选择 DeVoice";
  }
  if (config.kind === "speech" || config.kind === "dubbing") return "Our Advantages";
  if (config.kind === "clone") return "Why Choose DeVoice";
  if (config.kind === "noise") return "Our Features";
  if (config.kind === "voice-change" || config.kind === "voice-enhance") return "Why Choose DeVoice";
  if (config.kind === "youtube") return "Why Choose DeVoice";
  return "Why DeVoice";
}

function faqFor(config: ToolConfig): Array<[string, string]> {
  return faqBySlug[config.slug] ?? homeFaq;
}

function faqIntroFor(config: ToolConfig, locale: Locale) {
  if (locale === "zh-cn") {
    if (config.slug === "home" || config.slug === "ai-speech-to-text") return "了解 DeVoice 如何适配你的音视频工作流。";
    if (config.kind === "youtube" || config.slug === "audio-to-text" || config.slug === "video-to-text") return "有疑问？这里有答案。";
    return "";
  }
  if (config.slug === "home" || config.slug === "ai-speech-to-text") return "Learn how DeVoice fits your audio and video workflow.";
  if (config.kind === "youtube" || config.slug === "audio-to-text" || config.slug === "video-to-text") return "Got Questions? We've Got Answers!";
  return "";
}

const homeFaq: Array<[string, string]> = [
  [
    "What is DeVoice?",
    "DeVoice is an AI-powered speech-to-text platform designed to help users transcribe audio and video into accurate, editable text online. It also provides AI tools for transcription, audio enhancement, and content workflows."
  ],
  [
    "What makes DeVoice different from other transcription tools?",
    "DeVoice combines fast browser-based transcription with audio enhancement, YouTube workflows, voice tools, exports and a private resource workspace in one product."
  ],
  [
    "Who is DeVoice designed for?",
    "DeVoice is designed for creators, students, educators, researchers, marketers, teams and anyone who needs to turn audio or video into useful text."
  ],
  [
    "Can DeVoice handle both audio and video files?",
    "Yes. DeVoice supports common audio and video formats, including MP3, WAV, M4A, MP4, MOV and more."
  ],
  [
    "Does DeVoice require software installation?",
    "No. DeVoice runs directly in your browser, so you can upload files, paste links and manage results online."
  ],
  [
    "Is DeVoice suitable for beginners?",
    "Yes. The workflow is built around simple upload, paste and generate actions, so beginners can get transcripts without editing or technical setup."
  ],
  [
    "How fast is DeVoice transcription?",
    "Most files are processed quickly online. Processing time depends on file length, audio quality and the selected workflow."
  ],
  [
    "Is DeVoice secure to use?",
    "DeVoice handles uploads securely and keeps generated results in your private account workspace."
  ],
  [
    "Can DeVoice be used for professional workflows?",
    "Yes. DeVoice supports exports, resource management and repeatable audio, video and YouTube workflows for professional content production."
  ],
  [
    "Does DeVoice support multiple languages?",
    "Yes. DeVoice is designed for multilingual transcription, subtitle and voice workflows."
  ]
];

const textToSpeechFaq: Array<[string, string]> = [
  ["Is Devoice's text to speech tool free?", "Yes — it's completely free to use with no hidden fees."],
  ["How natural do AI voices sound?", "DeVoice generates smooth, expressive AI voices designed to sound natural for narration, videos, podcasts and presentations."],
  ["Can I download the generated audio?", "Yes. After generating speech, you can play the result online and export the audio for reuse."],
  ["Do I need to install anything?", "No. DeVoice text to speech runs online in your browser."],
  ["Why choose Devoice over other tools?", "DeVoice combines natural AI voices, multilingual output, custom voice options and a simple online workflow."],
  ["What languages and voice options does DeVoice support?", "DeVoice supports many languages and voice choices, including male, female and multilingual voice options."],
  ["Can I specify or upload custom voices on DeVoice?", "Yes. The voice panel includes custom voice upload support so you can generate speech with a favorite voice style."],
  ["Does DeVoice text to speech work on mobile?", "Yes. DeVoice works on Android, iPhone, Windows and macOS through a web browser."]
];

const faqBySlug: Partial<Record<DeVoiceToolSlug, Array<[string, string]>>> = {
  home: homeFaq,
  "ai-speech-to-text": homeFaq,
  "audio-to-text": [
    [
      "What is an Audio to Text Converter?",
      "An Audio to Text Converter is a tool that uses AI to convert audio to text automatically. It can transcribe spoken words from audio or video files into accurate, editable text within seconds."
    ],
    ["How accurate is this Audio to Text Converter?", "DeVoice uses AI speech recognition to produce accurate transcripts, with better results from clear audio and reduced background noise."],
    ["Can I convert MP3 to text online?", "Yes. Upload an MP3 file and DeVoice can convert the spoken audio into editable text online."],
    ["Does this tool support video to text conversion?", "Yes. You can upload supported video files and extract spoken content as text."],
    ["Is this Audio to Text Converter free to use?", "Yes. You can start converting audio to text online with the DeVoice workflow."],
    ["What languages are supported?", "DeVoice supports multilingual transcription for common global languages."],
    ["Can I transcribe audio with multiple speakers?", "Yes. DeVoice is designed for interviews, meetings and conversations with multiple voices."],
    ["Is my data secure when using this tool?", "Uploaded files and generated transcripts are handled securely inside your DeVoice workspace."]
  ],
  "video-to-text": [
    [
      "What does it mean to transcribe video to text?",
      "To transcribe video to text means converting spoken content in a video into written text using AI or transcription tools."
    ],
    ["Can I transcribe video to text free?", "Yes. You can use DeVoice to transcribe supported videos online through the browser workflow."],
    ["What formats are supported?", "Common video formats such as MP4, MOV and WEBM are supported, along with popular audio formats."],
    ["How accurate is video to text transcription?", "Accuracy depends on audio clarity, speech, language and background noise, and DeVoice is built to handle real-world recordings."],
    ["Can I convert video to text online without software?", "Yes. DeVoice runs in your browser, so no desktop software or extension is required."],
    ["Does it support multiple languages?", "Yes. DeVoice supports multilingual video transcription."],
    ["Can I edit the transcript after converting?", "Yes. Generated text can be reviewed, copied and exported for editing or reuse."],
    ["Is my data safe?", "DeVoice processes uploads securely and keeps results in your private resources."]
  ],
  "remove-background-noise": [
    [
      "On which devices can I use DeVoice to remove background noise?",
      "DeVoice is a fully web-based tool that works on all major devices. You can remove background noise from audio online using Windows, macOS, iOS, or Android - no app installation required."
    ],
    ["How does the AI remove background noise while keeping voices clear?", "DeVoice separates unwanted sounds such as hiss, hum, wind and room noise while preserving speech clarity."],
    ["How long does it take to remove background noise from audio?", "Most files are processed quickly online, with timing based on file length and audio complexity."],
    ["Do I need to register or pay to remove background noise?", "You can start with the online DeVoice workflow, and signing in lets you save, preview and download processed results."],
    ["Are my audio and video files secure during processing?", "Files are processed securely and kept in your private DeVoice account workspace."],
    ["How can I remove background noise from recorded audio or video?", "Upload an audio or video file, let DeVoice run AI noise reduction, then preview and download the cleaned audio."]
  ],
  "ai-noise-filter": [
    ["What does AI noise cancelling do?", "AI noise cancelling uses artificial intelligence to detect and remove unwanted sounds like static, hums, and background voices, improving overall audio clarity."],
    ["What is noise block AI?", "Noise block AI identifies background noise patterns and suppresses them while preserving the main voice or audio track."],
    ["How to filter noise from audio?", "Upload your audio or video file, let DeVoice run AI noise filtering, then preview and download the cleaned result."],
    ["Is DeVoice really free?", "You can start using the online AI noise filter workflow for free, with sign-in used for saving and processing resources."],
    ["Can I use DeVoice on mobile?", "Yes. DeVoice works in modern desktop and mobile browsers without installing software."],
    ["Which types of noise can DeVoice's AI noise filter remove?", "It can reduce common background sounds such as hiss, hum, traffic, room noise, wind, and other distractions in real-world recordings."]
  ],
  "ai-voice-enhancer-isolate": [
    ["What is an AI voice enhancer isolate tool?", "It uses artificial intelligence to separate and enhance spoken voice while reducing background noise automatically."],
    ["Can I isolate voice from noisy recordings?", "Yes. DeVoice can isolate voice from noisy audio or video files and reduce distracting background sounds."],
    ["Do I need audio editing experience?", "No. Upload your file and the AI voice enhancer isolate workflow handles the cleanup automatically."],
    ["Is the tool free to use?", "You can start with DeVoice online and sign in to process files, save results, and download enhanced voice audio."],
    ["Is my audio safe?", "Uploaded files are processed securely and kept in your private DeVoice resources."],
    ["What devices can I use this tool on?", "DeVoice works in modern desktop, tablet, and mobile browsers without installing software."]
  ],
  "ai-voice-changer": [
    ["Is DeVoice AI Voice Changer free to use?", "Yes. DeVoice offers a free AI voice changer online that lets you change voices using AI without downloading software. You can test different voice styles and experience natural voice changing before upgrading."],
    ["How is an AI voice changer different from an AI voice generator?", "An AI voice changer transforms an existing voice recording, while an AI voice generator creates speech from text. DeVoice focuses this page on changing uploaded or recorded voice audio into a new style."],
    ["Can I use the AI voice changer for videos?", "Yes. You can use changed voice audio in videos, streams, podcasts, games, social media, and other creative projects."],
    ["Is this AI voice changer suitable for live streaming or gaming?", "Yes. The workflow is designed for creators, streamers, and gamers who need fast, reliable voice-changing results."],
    ["Does the AI voice changer sound natural?", "DeVoice uses AI conversion to preserve speech timing, emotion, and clarity while changing the voice style."],
    ["Can I change my voice to different genders or characters?", "Yes. You can choose different voice identities, genders, and character-style voices to match your content."],
    ["What audio formats does the AI voice changer support?", "DeVoice supports common browser audio formats and produces downloadable MP3 or WAV result files."],
    ["Can I use AI voice changer results for commercial projects?", "Generated files can be used in creator workflows, but always confirm your plan and licensing needs before commercial publication."],
    ["Is my voice data safe when using the AI voice changer?", "Uploaded voice data is processed securely and kept in your private DeVoice resources."]
  ],
  "text-to-speech": textToSpeechFaq,
  "ai-voice-generator": textToSpeechFaq,
  "ai-voice-actors": textToSpeechFaq,
  "ai-dubbing": [
    ["What is Dubbing AI?", "Dubbing AI is a tool that converts written text into spoken audio using AI-generated or uploaded voices, commonly used for video voiceovers and localization."],
    ["Can I upload my own voice for AI dubbing?", "Yes. You can upload a reference voice or choose from preset AI voices for dubbing, narration, and explainer content."],
    ["Is Dubbing AI online or software-based?", "Dubbing AI runs online in your browser, so you do not need to install audio editing software."],
    ["How natural does the AI dubbing sound?", "The output is designed for smooth pacing, clear pronunciation, and a natural tone, though final quality depends on the input script and selected voice."],
    ["What file formats can I download?", "Generated results can be previewed online and exported as MP3 or WAV from the result page."],
    ["Who should use Dubbing AI?", "Creators, educators, marketers, localization teams, and product teams can use Dubbing AI to create voiceovers for videos, courses, ads, and training content."]
  ],
  "ai-music-generator": [
    ["What does the AI Music Generator create?", "It creates a prompt-based music preview record with playable MP3/WAV exports for drafts, videos and creative workflows."],
    ["Can I choose a music style?", "Yes. The prompt panel includes style directions such as cinematic, pop, lo-fi, EDM, ambient and acoustic."],
    ["Can I download the generated music?", "Yes. Music results can be previewed online and exported as MP3 or WAV from the result page."],
    ["Is this for final commercial music?", "The local clone provides functional preview generation and export workflows; final usage still depends on your rights, provider setup and production review."],
    ["Does it save my music ideas?", "Yes. Generated music jobs appear in My Resources and Dashboard history."],
    ["Does it work on mobile?", "Yes. DeVoice runs in modern desktop and mobile browsers."]
  ],
  "ai-rap-generator": [
    ["What does the AI Rap Generator create?", "It creates a prompt-based rap audio preview record with playable MP3/WAV exports for demos and drafts."],
    ["Can I choose a rap style?", "Yes. The prompt panel includes trap, boom bap, drill, melodic, old school and club style directions."],
    ["Can I download the rap output?", "Yes. Rap results can be previewed online and exported as MP3 or WAV from the result page."],
    ["Can I use it for hook ideas?", "Yes. The workflow is designed for hooks, flow directions, campaign audio and creative placeholders."],
    ["Does it save generated rap jobs?", "Yes. Generated rap jobs remain available in your DeVoice resources."],
    ["Does it work on mobile?", "Yes. DeVoice runs in modern desktop and mobile browsers."]
  ],
  "ai-rap-lyrics-generator": [
    ["What does the AI Rap Lyrics Generator create?", "It creates structured rap lyrics with verses, hook, bridge, summary and exportable text records."],
    ["Can I choose a lyrics style?", "Yes. The prompt panel includes trap, boom bap, storytelling, battle rap, melodic and conscious directions."],
    ["Can I download the lyrics?", "Yes. Lyrics can be exported as transcript, TXT, summary or JSON from the result page."],
    ["Can I edit the generated lyrics?", "The result page gives you copy and export controls so you can continue editing in your own writing or music workflow."],
    ["Does it save generated lyrics?", "Yes. Generated lyrics jobs remain available in your DeVoice resources."],
    ["Does it work on mobile?", "Yes. DeVoice runs in modern desktop and mobile browsers."]
  ],
  "ai-voice-cloning": [
    [
      "What is AI Voice Cloning used for?",
      "AI Voice Cloning is commonly used for content creation, education, games, accessibility, and voiceovers where realistic speech is needed."
    ],
    ["How accurate is DeVoice's AI Voice Cloning?", "DeVoice focuses on smooth, expressive output that follows the tone and character of a clear uploaded voice sample."],
    ["How long does the voice sample need to be?", "A clear short voice sample can work, though cleaner recordings usually improve the generated result."],
    ["Is AI voice cloning safe and ethical?", "Only clone voices you own or have permission to use, and avoid impersonation or misleading use."],
    ["Can I generate multiple scripts with the same cloned voice?", "Yes. Once you provide the sample and text, you can regenerate audio for new or edited scripts."],
    ["What devices can I use DeVoice on?", "DeVoice runs online in modern browsers on desktop and mobile devices."]
  ],
  "youtube-transcript-generator": [
    [
      "What is a YouTube transcript generator?",
      "A YouTube transcript generator converts spoken content from YouTube videos into written text automatically using AI."
    ],
    ["Can I generate transcripts from any YouTube video?", "You can generate transcripts from public videos when captions or audio content are available for processing."],
    ["Is this a free YouTube transcript generator?", "Yes. DeVoice provides an online YouTube transcript workflow you can start using for free."],
    ["How accurate is the YouTube video transcript generator?", "Accuracy depends on the source video's speech clarity, language, captions and background noise."],
    ["Can I use the transcript for SEO or content creation?", "Yes. Transcripts can help with research, notes, blog posts, captions, summaries and searchable content."],
    ["Do I need to install anything?", "No. Paste a YouTube link and use DeVoice directly in your browser."]
  ],
  "transcribe-youtube-videos": [
    ["Can I transcribe any YouTube video?", "You can transcribe public YouTube videos when the audio or captions are available for processing."],
    ["Is this service free?", "You can start the DeVoice YouTube transcription workflow online for free."],
    ["How accurate is the transcription?", "Accuracy depends on speech clarity, accents, background noise, and source quality, and DeVoice is designed for clean readable transcripts."],
    ["What formats can I export to?", "Generated transcript jobs can be copied or exported from the result page using the available DeVoice export controls."],
    ["Does it support multiple languages?", "Yes. DeVoice supports multilingual transcription workflows for many common languages."],
    ["How long does it take to transcribe a YouTube video?", "Short videos usually process quickly, while longer videos depend on length, queue state, and audio complexity."],
    ["Can I share transcripts with others?", "You can export transcript results and reuse them in your own notes, documents, captions, or team workflows."]
  ],
  "youtube-subtitle-downloader": [
    [
      "Is the YouTube Subtitle Downloader free to use?",
      "Yes. DeVoice offers free access with no hidden costs or subscriptions."
    ],
    ["Can I download subtitles from any YouTube video?", "You can download subtitles when the public video has accessible subtitle or caption data."],
    ["What subtitle formats are supported?", "DeVoice supports common subtitle exports such as SRT and VTT, plus text-based exports for reuse."],
    ["Can I choose different subtitle languages?", "Yes. When multiple subtitle languages are available, you can choose the language you need."],
    ["Do I need to install any software?", "No. The YouTube Subtitle Downloader works online in your browser."],
    ["Is it safe to use DeVoice's YouTube Subtitle Downloader?", "Yes. The workflow is browser-based and processes links/results securely."],
    ["Can I use this tool on mobile devices?", "Yes. DeVoice works on mobile and desktop browsers."],
    ["Is it legal to download YouTube subtitles?", "Use downloaded subtitles responsibly and follow YouTube terms, copyright rules and the content owner's permissions."]
  ],
  "youtube-video-summarizer": [
    [
      "Is this YouTube video summarizer free?",
      "Yes. You can use the YouTube video summarizer online free without downloading any software."
    ],
    ["Can I summarize long YouTube videos?", "Yes. DeVoice is designed to summarize both short videos and longer tutorials, lectures and presentations."],
    ["Does it generate summaries with timestamps?", "DeVoice can produce structured summaries and timestamp-style takeaways when source transcript data supports it."],
    ["Do I need to download anything?", "No. Paste a YouTube link and generate a summary online in your browser."],
    ["Is my data stored?", "Video links and generated summaries are processed with privacy in mind and saved only as part of your DeVoice resource workflow."]
  ]
};
