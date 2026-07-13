/* eslint-disable @next/next/no-img-element */
import type { Locale } from "@/lib/i18n";
import { DeVoiceFooter } from "@/components/devoice-footer";
import { DeVoiceShell } from "@/components/devoice-shell";
import { localizedPath } from "@/lib/i18n";

export type StaticPageSlug = "blog" | "privacy-policy" | "refund-policy" | "terms-of-use";

type PolicyBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "heading"; level?: 2 | 3; text: string }
  | { type: "rule" };

type StaticPageConfig = {
  title: string;
  seoTitle?: string;
  description: string;
  sections: Array<[string, string]>;
  blocks?: PolicyBlock[];
};

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  showHeroImage?: boolean;
  body: Array<string | { type: "heading"; level?: 2 | 3; text: string } | { type: "paragraph"; text: string }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-download-youtube-videos",
    title: "How to Download YouTube Videos Safely & Efficiently | DeVoice",
    category: "Blog",
    author: "Admin",
    date: "December 19, 2025",
    image: "/assets/blog/how-to-download-youtube-videos-safely-efficiently.webp",
    imageAlt: "How to Download YouTube Videos Safely & Efficiently|DeVoice",
    excerpt: "Learn how to download YouTube videos safely, quickly, and ad-free with DeVoice. Get high-quality MP4 files without malware or privacy risks.",
    body: [
      "The first time I seriously searched how to download YouTube videos, it wasn't for anything complicated. I was simply trying to finish watching a tutorial on a train.",
      "The signal kept cutting out. The video buffered every few seconds. I tried lowering the resolution, but it didn't help much. At that moment, it hit me how dependent streaming had made me. I had access to millions of videos, but only when the internet cooperated.",
      "Later that week, I ran into the same issue again---this time with a long interview I wanted to rewatch for work. The video was still online, but I knew it might not stay there forever. Creators delete content. Channels get taken down. Links break.",
      "That's when I realized learning how to download YouTube videos wasn't about convenience anymore. It was about control. I wanted to decide when and where I could watch content, without worrying about Wi-Fi, platform rules, or disappearing videos.",
      "Other Real-Life Scenarios Where Downloading YouTube Videos Makes Sense",
      "Once I started paying attention, I noticed how often the need to download YouTube videos comes up in everyday life---for people from all walks of life. It's not just about convenience; it's about solving real problems that streaming alone can't address.",
      "Travel: Offline Learning & Entertainment on the Go",
      "Take travel, for example. Whenever I plan a trip, I spend hours curating educational videos about my destination---history documentaries, local food guides, and transportation tutorials. But airports, trains, and remote areas rarely have reliable internet, so I always search for how to download YouTube videos to device or how to download YouTube videos to camera roll before I leave.",
      "Students: Offline Access for Study & Exam Prep",
      "Students are another group that benefits immensely from downloading YouTube videos. Many learners rely on online lectures, tutorials, and exam prep videos, but internet access is not always stable in libraries, dorms, or on long commutes.",
      "How to download YouTube videos legally",
      "Start with the simplest legal workflow: use the creator's download option, YouTube's offline features, or content you own and have permission to reuse. Always respect copyright, creator permissions, and platform terms before saving or republishing any video.",
      "Five Tools for How to Download YouTube Videos",
      "Different tools solve different problems. Some focus on offline viewing, some focus on extracting captions, and others help you turn spoken content into searchable notes. The safest choice is the one that matches your permission level and your actual workflow.",
      "How to Download YouTube Videos Safely with DeVoice",
      "For research and repurposing, DeVoice focuses on transcript and summary workflows. Paste a public YouTube URL, generate readable text, then export notes without storing a full video file.",
      "When you need captions, use the subtitle downloader to produce SRT, VTT or TXT style text that can be edited, translated and attached to your own projects.",
      "Key Legal Reminders",
      "Do not download or reuse videos that you do not have permission to save. Avoid tools that hide malware behind fake download buttons, demand unnecessary browser permissions, or ask for private account credentials.",
      "Final Thoughts: Choosing the Right Way to Download YouTube Videos",
      "The best way to download YouTube videos depends on what you actually need. If you want offline viewing, use official options when available. If you need research notes, captions, or summaries, a text-first workflow like DeVoice can be safer and easier to manage."
    ]
  },
  {
    slug: "exploring-ai-vocal-cleaner-clean-up-audios",
    title: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click",
    category: "Blog",
    author: "Admin",
    date: "July 4, 2025",
    image: "/assets/blog/ai-voice-cleaner.webp",
    imageAlt: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click",
    excerpt: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click In the dynamic...",
    showHeroImage: true,
    body: [
      "In the dynamic realm of digital content creation, the quality of audio and video is often the linchpin that determines whether a project feels polished or unfinished. Musicians, podcasters, vloggers, teachers, and business teams all run into the same problem: important voices can be buried under room noise, low-quality microphones, traffic, hum, or inconsistent levels.",
      { type: "heading", text: "Introducing DeVoice: The AI-Powered Voice Cleaner" },
      "DeVoice is an AI-driven voice cleaner built to simplify and streamline the audio enhancement process. It is more than a single filter: the platform is structured around removing background noise, isolating vocals, improving clarity, and making speech-heavy recordings easier to work with from the moment a file is uploaded.",
      "Unlike traditional editing suites, DeVoice does not ask users to install software or understand technical controls before they can start. The important path is intentionally direct: open the tool, provide a file, process it, review the result, and keep the voice natural enough for real listening.",
      { type: "heading", text: "How to Use DeVoice: Step-by-Step" },
      "Using DeVoice is refreshingly simple, even for beginners. As a free online voice cleaner, it is designed for users who need a reliable result quickly, not for people who want to spend an afternoon tuning equalizers, drawing noise profiles, or comparing plugin chains across a desktop editing suite.",
      "Here is how to use it effectively: first, open DeVoice in your browser and choose the workflow that matches the file you have. For noisy speech, interviews, lessons, meetings, and creator footage, the cleanup path is the fastest starting point because it is built around speech clarity rather than broad music mastering.",
      "Second, upload your file. DeVoice is intended for common creator formats, so voice memos, interviews, lessons, meeting clips, screen recordings, and short videos can enter the same workflow without forcing you to convert everything by hand. This is important because real production files rarely arrive in one perfect format.",
      "Third, let AI process the recording. The system analyzes the audio, looks for the voice-like signal, reduces distracting background sound, and prepares a cleaner version for review. The user does not need to manually decide which frequency belongs to a fan, which part is room echo, or how much static is too much.",
      "Fourth, listen before exporting. A good workflow always includes a quick review step because every recording is different. Some files need only light cleanup, while others need a stronger pass before the voice becomes clear enough for publishing, transcription, subtitles, or internal documentation.",
      "Fifth, download or reopen the result. Once the job finishes, the cleaned output can be reused in video editors, podcast workflows, social clips, classroom materials, meeting notes, or any place where clear speech matters more than the original noisy environment.",
      "This process is especially helpful when cleanup is only one step in a larger content pipeline. A clearer voice can make captions more accurate, transcripts easier to read, summaries more reliable, and edited videos more comfortable to watch on small speakers or headphones.",
      "For best results, start with the clearest source you have. AI can improve difficult recordings, but a file with reasonable volume, minimal clipping, and a speaker close to the microphone will almost always produce a more natural output than a file recorded from across a noisy room.",
      "If you are working with a long recording, process a short sample first. A quick test helps you confirm whether the cleanup level is right before committing time to a full episode, lecture, webinar, training session, or interview archive.",
      "When the source contains both speech and music, decide what you actually need before processing. If the goal is spoken clarity, prioritize the voice. If the goal is a remix, instrumental, or music stem, use a vocal isolation workflow that treats the source differently.",
      "Creators should also keep the original file. A clean export is useful, but the untouched source gives you a safe fallback if you later want to try a different cleanup intensity, create subtitles from another pass, or compare results across multiple devices.",
      "The simple upload-process-download pattern is what makes DeVoice useful for everyday users. It turns audio cleanup from a specialist task into a repeatable step that can fit inside a weekly publishing schedule, a classroom routine, or a remote team's documentation workflow.",
      { type: "heading", text: "Audio Enhancer Capabilities for Studio-Quality Sound" },
      "A strong voice cleaner does more than remove a single hiss or hum. It should improve intelligibility while keeping the speaker recognizable, natural, and comfortable to hear.",
      "DeVoice focuses on the practical enhancements creators need most: clearer speech, reduced background interference, steadier volume, and a cleaner foundation for downstream editing without pushing every voice into an artificial studio effect.",
      { type: "heading", text: "How It Works: From Upload to Download in Minutes" },
      "The workflow begins when a user uploads a file through the DeVoice interface. The backend entry records the job and prepares it for processing, creating a stable place for future provider integrations and completed results.",
      "Once processing starts, AI models analyze the audio to identify speech, background noise, music bleed, reverb, and other elements that may reduce clarity. The cleaner output is then made available for preview and export.",
      "From the user's point of view, the flow stays simple. They do not have to understand the model choices behind the scenes; they only need a dependable path from raw file to usable result and a result page that makes the finished job easy to reopen.",
      { type: "heading", text: "The Real Challenge: Why Audio Quality Matters" },
      "Audio issues can ruin even visually polished content. A beautifully shot video becomes difficult to watch if the dialogue is muffled, distorted, or covered by a fan, street noise, or echo.",
      "Poor audio also affects accessibility and reuse. Transcription tools depend on intelligible speech, subtitle workflows need clean timing and clear words, and summary tools perform better when the source audio is not fighting against background sound.",
      "Traditional production fixes often required expensive microphones, treated rooms, and professional editing skills. Those still help, but many creators need a faster rescue path for recordings that already exist, and AI cleanup fills that gap.",
      { type: "heading", text: "Who Can Benefit from DeVoice?" },
      "1. Musicians and DJs: Musicians often need to isolate vocals, clean demo recordings, or make rough ideas easier to review. DeVoice can help separate the voice from distracting elements before further editing.",
      "2. Podcasters: Remote interviews, guest audio, and home setups often produce inconsistent quality. A cleanup pass can make conversations easier to listen to before final mixing.",
      "3. Video creators: Vloggers, educators, and short-form creators frequently record outside studio conditions. Cleaner voice tracks make videos feel more professional even when the footage is casual.",
      "4. Students and teachers: Lectures, study recordings, and classroom clips become easier to understand when background chatter and room noise are reduced.",
      "5. Business teams: Meetings, webinars, product demos, and training sessions are more useful when the spoken content can be heard clearly and turned into notes or transcripts.",
      "6. Journalists, researchers, and social media teams: Field interviews and fast publishing cycles rarely produce perfect source audio. AI cleanup can preserve important speech and make a short clip feel ready without opening a full desktop editor.",
      { type: "heading", text: "Why a Voice Cleaner Is Essential for Today’s Creators" },
      "Modern creators publish across many formats. One recording may become a YouTube video, podcast episode, transcript, subtitle file, social clip, blog outline, and internal knowledge asset.",
      "When the original voice track is noisy, every downstream format suffers. Captions contain more mistakes, viewers leave sooner, editors spend more time repairing issues, and collaborators have a harder time reviewing the material.",
      "A voice cleaner turns audio quality into an early workflow step rather than a late emergency. By cleaning speech before repurposing it, creators can make the rest of the pipeline more reliable.",
      "It also helps teams maintain consistency. Even when recordings come from different microphones, rooms, and devices, cleanup can bring them closer to a shared quality standard, which is why voice-cleaning tools have moved from novelty to necessity.",
      { type: "heading", text: "Common Mistakes to Avoid When Cleaning Up Audio" },
      { type: "heading", level: 3, text: "1. Overusing Noise Reduction" },
      "Heavy cleanup can remove room noise, but it can also damage the voice. If the result sounds metallic, thin, or unstable, use a lighter pass or start from a better recording.",
      { type: "heading", level: 3, text: "2. Ignoring Recording Setup" },
      "AI helps after recording, but basic setup still matters. Move closer to the microphone, reduce fans and echoes when possible, and capture a short test before recording something important.",
      { type: "heading", level: 3, text: "3. Removing Too Much Silence" },
      "Silence can make speech feel natural. Cutting every pause may produce a rushed result, especially for interviews, lessons, and narration.",
      { type: "heading", level: 3, text: "4. Skipping EQ" },
      "Some files need tonal balance as much as noise reduction. If a voice is boomy, harsh, or dull, cleanup alone may not solve every listening issue.",
      { type: "heading", level: 3, text: "5. Overcompressing" },
      "Compression can make quiet words easier to hear, but too much compression exaggerates breaths, clicks, and leftover background noise.",
      { type: "heading", level: 3, text: "6. Not Saving Backups" },
      "Always keep the original file. A clean export is useful, but the source recording gives you a safe fallback if you need to try different settings later.",
      { type: "heading", level: 3, text: "7. Ignoring Multi-Device Playback" },
      "Check the result on headphones, laptop speakers, and phone speakers when quality matters. A voice can sound clear in one environment and too sharp or quiet in another.",
      { type: "heading", level: 3, text: "8. Trying to Fix Everything at Once" },
      "Work in stages. First make the voice understandable, then polish levels, then export for the final destination. A staged workflow is easier to control.",
      { type: "heading", text: "Frequently Asked Questions (FAQ)" },
      "Can DeVoice clean both audio and video? Yes. The workflow is designed around common audio and video sources so users can improve speech without manually extracting every track first.",
      "Do I need editing experience? No. The interface is built for a direct upload-and-process flow, which makes it useful for beginners and fast production teams.",
      "Will AI cleanup make every recording perfect? No tool can repair every source. Distorted microphones, clipped speech, or extremely loud background music can still limit the final result.",
      "What should I do before uploading? Use the clearest file available, avoid unnecessary conversions, and keep the original recording as a backup.",
      "Can cleaner audio improve transcription and subtitles? Yes. Clearer speech usually gives downstream text workflows a better source, which can reduce mistakes and manual cleanup.",
      { type: "heading", level: 3, text: "Conclusion: Why DeVoice Is the Future of Clean Audio" },
      "Clean audio is no longer optional for creators who want their work to be understood, shared, and reused. DeVoice gives users a practical path to clearer voices without turning every project into a technical editing session.",
      "By combining browser-based access, AI-powered cleanup, and a simple upload-to-export workflow, DeVoice makes professional-sounding speech more reachable for everyday recordings.",
      "The result is a faster production pipeline: record what matters, clean the voice, and move confidently into publishing, transcription, subtitles, summaries, or future creative work."
    ]
  },
  {
    slug: "how-to-extract-audio-from-video",
    title: "How to Extract Audio from Video Online for Free with DeVoice",
    category: "Blog",
    author: "Admin",
    date: "June 19, 2025",
    image: "/assets/blog/how-to-extract-audio-from-video.webp",
    imageAlt: "How to Extract Audio from Video Online for Free with DeVoice",
    excerpt: "How to Extract Audio from Video Online for Free with DeVoice In today's digital era,...",
    body: [
      "Video is one of the easiest formats to create and one of the hardest formats to reuse. A lecture, webinar, interview, podcast recording, tutorial, or livestream may contain valuable audio, but that audio is locked inside the video file until you extract or process it.",
      "DeVoice gives creators and teams a practical way to work with the audio track from a video. You can upload a video, extract the audio, clean it, transcribe it, or turn it into subtitles and summaries depending on what you need next.",
      { type: "heading", text: "Why Extract Audio from Video?" },
      "Sometimes you do not need the video at all. You may only need a podcast-ready audio track, a clean interview recording, a voiceover, captions, meeting notes, or searchable text from the spoken content.",
      "Extracting audio also helps when video files are too large to share. A smaller audio file or transcript is easier to store, edit, translate, and repurpose.",
      { type: "heading", text: "How to Extract Audio from Video Online" },
      { type: "heading", level: 3, text: "Step 1: Upload Your Video" },
      "Choose the video file you want to process. Common formats such as MP4, MOV, MKV, and AVI are typical starting points for creator and business workflows.",
      { type: "heading", level: 3, text: "Step 2: Choose the Right Output" },
      "If you need an audio file, use the audio extraction workflow. If you need editable text, use Video To Text. If the audio is noisy, clean it before you generate a transcript or captions.",
      { type: "heading", level: 3, text: "Step 3: Export and Reuse" },
      "Once processing is complete, open the result page from My Resources. From there, you can preview outputs and export files for editing, publishing, documentation, or collaboration.",
      { type: "heading", text: "Best Use Cases" },
      "Content creators can turn long videos into podcast episodes, short-form captions, blog outlines, or newsletter material. Students can extract lectures for review. Teams can convert recorded meetings into notes, summaries, and searchable archives.",
      { type: "heading", text: "Tips for Better Results" },
      "Start with a clean source whenever possible. Avoid processing files with extremely low volume, heavy music over speech, or distorted microphones unless you plan to clean the audio first.",
      "For long recordings, run a short sample to check quality. This saves time and helps you decide whether audio extraction, transcription, noise removal, or summarization is the right next step.",
      { type: "heading", text: "Final Thoughts" },
      "Extracting audio from video is not just a conversion task. It is the first step in a larger workflow for repurposing spoken content. DeVoice keeps that workflow in one place so you can move from video to audio, text, subtitles, and summaries without unnecessary friction."
    ]
  },
  {
    slug: "ai-noise-remover-tools-for-dynamic-noise-reduction-online",
    title: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025",
    category: "Blog",
    author: "Admin",
    date: "June 6, 2025",
    image: "/assets/blog/ai-tools-for-ai-noise-reduction-online.webp",
    imageAlt: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025",
    excerpt: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025 In today's...",
    body: [
      "Noise reduction has become a daily need for creators, students, remote teams, and anyone recording outside a studio. The challenge is choosing tools that remove distracting sound without making the speaker sound robotic or over-processed.",
      "This guide compares what matters when choosing an AI noise remover and highlights five practical categories of tools for dynamic noise reduction online in 2025.",
      { type: "heading", text: "What Makes a Good AI Noise Remover?" },
      "A good noise remover should preserve speech clarity, support common audio and video formats, process quickly, and give you a way to preview the result before you commit to an export.",
      "It should also fit your privacy expectations. Uploading recordings can involve sensitive conversations, so clear retention policies and account controls matter.",
      { type: "heading", text: "Top 5 AI Noise Remover Tool Types" },
      { type: "heading", level: 3, text: "1. Browser-Based AI Noise Removal" },
      "Online tools are convenient when you need quick cleanup without installing software. They are ideal for students, creators, and small teams that want a simple upload-process-download workflow.",
      { type: "heading", level: 3, text: "2. Creator Editing Suites" },
      "Video editors and podcast platforms often include noise reduction as part of a larger editing suite. These are useful when cleanup is only one step in a publishing workflow.",
      { type: "heading", level: 3, text: "3. Meeting Enhancement Tools" },
      "Some tools focus on calls and meetings, improving speech in real time or after a recording. They are useful for teams that archive discussions and create notes later.",
      { type: "heading", level: 3, text: "4. Professional Audio Plugins" },
      "Audio engineers may prefer plugin-based workflows because they allow deeper control. These tools are powerful, but they require more setup and experience.",
      { type: "heading", level: 3, text: "5. DeVoice for Speech-Centered Cleanup" },
      "DeVoice keeps the workflow compact: upload the file, remove background noise, preview the cleaned result, and store it in My Resources. It is especially helpful when cleanup connects to transcription, subtitles, summaries, or other AI audio workflows.",
      { type: "heading", text: "How to Compare Tools" },
      "Look at supported formats, file-size limits, processing speed, preview quality, export options, account requirements, and whether the tool handles video files as well as audio files.",
      "For speech-heavy content, the most important test is intelligibility. A result that sounds slightly processed but easy to understand is often more useful than a result that sounds smooth but hides words.",
      { type: "heading", text: "Final Thoughts" },
      "The best AI noise remover is the one that fits your source material and your next step. If your goal is cleaner speech for transcripts, subtitles, summaries, or creator edits, DeVoice gives you a focused starting point."
    ]
  },
  {
    slug: "how-to-get-the-audio-from-a-video",
    title: "How to Get the Audio from a Video in 2025: 6 Easy Methods",
    category: "Blog",
    author: "Admin",
    date: "May 6, 2025",
    image: "/assets/blog/how-to-get-the-audio-from-a-video.webp",
    imageAlt: "How to Get the Audio from a Video in 2025: 6 Easy Methods",
    excerpt: "How to Get the Audio from a Video in 2025 with 6 Easy Methods Extracting...",
    body: [
      "Getting the audio from a video sounds simple until you need the result to be clean, searchable, reusable, and easy to share. A raw video file may contain a lecture, voiceover, interview, meeting, or tutorial, but the audio track is often what you actually need.",
      "In 2025, there are several practical ways to get audio from a video. The right method depends on whether you want an audio file, a transcript, subtitles, a summary, or cleaner speech.",
      { type: "heading", text: "Method 1: Use an Online Audio Extractor" },
      "An online extractor is the fastest path when you simply need the audio track. Upload the video, process it, and download the audio output. This is useful for short creator clips, voiceovers, and repurposing workflows.",
      { type: "heading", text: "Method 2: Convert Video to Text" },
      "If your goal is research, notes, editing, or search, a transcript may be more useful than an audio file. DeVoice Video To Text turns spoken content into readable text that can be copied, edited, translated, or summarized.",
      { type: "heading", text: "Method 3: Generate Subtitles" },
      "For publishing or accessibility, subtitles are often the best output. Captions make videos easier to watch without sound and easier to repurpose across platforms.",
      { type: "heading", text: "Method 4: Clean the Audio First" },
      "If your video has background noise, music, wind, or echo, clean the audio before creating a transcript or subtitles. Cleaner source audio usually leads to better downstream results.",
      { type: "heading", text: "Method 5: Use Desktop Editing Software" },
      "Professional editors can extract audio inside desktop video tools. This gives more control, but it takes longer and may be unnecessary for everyday transcription or content reuse.",
      { type: "heading", text: "Method 6: Use DeVoice as a Workflow Hub" },
      "DeVoice connects several related steps: audio extraction, video transcription, noise removal, subtitles, and summaries. Instead of exporting and re-uploading between separate tools, you can keep the job history in My Resources.",
      { type: "heading", text: "Which Method Should You Choose?" },
      "Choose audio extraction when you need a sound file. Choose transcription when you need searchable text. Choose subtitles when you are publishing video. Choose cleanup first when speech quality is poor.",
      { type: "heading", text: "Final Thoughts" },
      "Getting audio from a video is really about unlocking the spoken content. Once the audio is accessible, you can edit it, clean it, transcribe it, summarize it, or turn it into new content."
    ]
  },
  {
    slug: "remove-lead-vocals-from-songs",
    title: "Remove Lead Vocals from Songs with DeVoice [Ultimate Guide]",
    category: "Blog",
    author: "Admin",
    date: "April 17, 2025",
    image: "/assets/blog/free-remove-lead-vocals-from-songs-with-devoice.webp",
    imageAlt: "Remove Lead Vocals from Songs with DeVoice [Ultimate Guide]",
    excerpt: "Remove Lead Vocals from Songs Online for Free with DeVoice [Ultimate Guide] Removing vocals from...",
    body: [
      "Removing lead vocals from songs can help creators make practice tracks, karaoke-style references, remixes, study materials, and cleaner instrumental beds. The quality depends heavily on the original mix, but AI separation has made the workflow much more accessible.",
      "DeVoice is focused on speech and audio workflows, but the same principles matter when working with music: understand the source, choose the right tool, preview the result, and respect copyright.",
      { type: "heading", text: "How Vocal Removal Works" },
      "Lead vocals usually sit in the center of a stereo mix and share frequency space with instruments. AI vocal separation analyzes patterns in the audio and attempts to isolate the vocal layer from the instrumental bed.",
      "No tool can perfectly separate every song. Dense mixes, heavy reverb, backing vocals, and effects can make separation harder.",
      { type: "heading", text: "When Should You Remove Lead Vocals?" },
      "Musicians may remove vocals to practice melody lines or rehearse with an instrumental track. Creators may need a reference for covers, choreography, teaching, or remix experiments.",
      "For commercial release, licensing matters. Removing vocals does not automatically give you rights to reuse the underlying recording.",
      { type: "heading", text: "A Responsible Workflow" },
      { type: "heading", level: 3, text: "Step 1: Start with a High-Quality Source" },
      "Low-bitrate files and distorted recordings make separation artifacts more obvious. Use the clearest lawful source you have permission to process.",
      { type: "heading", level: 3, text: "Step 2: Separate and Preview" },
      "Run a short sample first. Listen for leftover vocal fragments, phase artifacts, or instrument loss before processing a longer track.",
      { type: "heading", level: 3, text: "Step 3: Clean or Repurpose Carefully" },
      "If your goal is speech clarity rather than music remixing, use noise removal and transcription workflows instead. For podcasts, meetings, lessons, and interviews, DeVoice background noise removal is usually the better fit.",
      { type: "heading", text: "Legal and Creative Notes" },
      "Always check rights before publishing or monetizing edited music. Personal practice and private study are different from public distribution, remix releases, or commercial use.",
      { type: "heading", text: "Final Thoughts" },
      "AI vocal removal is powerful, but it works best when paired with realistic expectations and responsible use. For speech-first audio, DeVoice helps you clean, transcribe, and reuse recordings without turning the workflow into a full audio engineering project."
    ]
  },
  {
    slug: "how-to-remove-music-from-video",
    title: "How to Remove Music from Video [2025's Top 10 Tools]",
    category: "Blog",
    author: "Admin",
    date: "April 9, 2025",
    image: "/assets/blog/how-to-remove-music-top-tools.webp",
    imageAlt: "How to Remove Music from Video [2025's Top 10 Tools]",
    excerpt: "How to Remove Music from Video [10 Best Online Tools] Question:\"How do I remove music...",
    body: [
      "Background music can make a video feel polished, but it can also get in the way when you need clear speech, captions, a transcript, or a reusable voice track. Removing music from video is harder than removing simple noise because music overlaps speech across many frequencies.",
      "This guide explains practical ways to reduce or remove music from video and when a transcript or cleaned voice track may be a better output than a perfect instrumental removal.",
      { type: "heading", text: "Why Removing Music from Video Is Difficult" },
      "Music contains rhythm, harmony, reverb, and instruments that may share the same frequency range as the speaker. If the music is loud, compressed, or mixed directly under the voice, no online tool can guarantee a perfect result.",
      "AI can still improve intelligibility. The goal is often to make speech easier to understand, not to produce a studio-quality isolated voice.",
      { type: "heading", text: "Best Ways to Remove or Reduce Music" },
      { type: "heading", level: 3, text: "1. Use AI Voice Isolation" },
      "AI voice isolation attempts to keep the speaker and reduce everything else. This works best when the speaker is clearly louder than the music.",
      { type: "heading", level: 3, text: "2. Clean the Audio Before Transcription" },
      "If your goal is text, clean the audio first, then generate a transcript. Even partial music reduction can improve transcript quality.",
      { type: "heading", level: 3, text: "3. Extract Audio and Edit Separately" },
      "For editing workflows, extract the audio track from the video and process it separately. This makes it easier to preview, compare, and replace the final audio.",
      { type: "heading", level: 3, text: "4. Recreate Captions Instead of Audio" },
      "When music cannot be fully removed, a clean transcript or subtitle file may still capture the important spoken content for publishing, research, or accessibility.",
      { type: "heading", text: "How DeVoice Helps" },
      "DeVoice supports related workflows: extract audio from video, remove background noise, generate transcripts, create subtitles, and summarize spoken content. That means you can choose the output that solves the real problem, not just the original file-format problem.",
      { type: "heading", text: "Final Thoughts" },
      "Removing music from video is possible in many cases, but results depend on the mix. Start with a short sample, choose the output you actually need, and use transcription or subtitles when clean text matters more than perfect audio separation."
    ]
  },
  {
    slug: "remove-background-noise-and-background-conversation",
    title: "Ultimate Guide to Remove Background Noise and Conversation",
    category: "Blog",
    author: "Admin",
    date: "April 9, 2025",
    image: "/assets/blog/remove-background-noise.webp",
    imageAlt: "Ultimate Guide to Remove Background Noise and Conversation",
    excerpt: "Ultimate Guide to Remove Background Noise and Conversation in 2025 In early 2025, a 15-year-old...",
    body: [
      "In early 2025, a 15-year-old boy named Joshua Blake from Trowbridge, Wiltshire, shocked the world with his raw vocal talent. After performing as a busker on the streets of Munich, Germany, this teenage sensation was spotted by passersby who were so moved by his performance that they encouraged him to audition for The Voice Kids Germany. Not only did Joshua secure a spot, but he advanced to the semifinals—receiving a unanimous “yes” from all four judges.",
      "His story reminds us of something powerful: talent is everywhere, but opportunities are not always equally distributed. How many gifted singers, content creators, and storytellers are being held back—not by a lack of ability—but by something as simple as background noise?",
      "If you’ve ever dreamed of singing, podcasting, or creating content, but felt held back by poor audio quality, you’re not alone. Whether it’s background conversation in your room, traffic outside, or the hum of electronics, noisy environments can ruin a good recording. The good news? AI is changing the game.",
      "Thanks to free online tools like DeVoice, anyone can now remove background noise and background conversation from their audio—no expensive studio, no technical skills required. In this ultimate guide, we’ll show you how and why clean audio matters more than ever.",
      { type: "heading", text: "Quick Links" },
      { type: "heading", level: 3, text: "Meet DeVoice: The Free AI Tool That Removes Background Noise and Conversation" },
      "DeVoice is a 100% free, browser-based AI tool that separates and cleans audio in seconds. It’s ideal for singers, content creators, voice actors, or anyone who wants studio-quality audio without the studio.",
      { type: "heading", text: "Top Features of DeVoice:" },
      { type: "heading", text: "How to Use DeVoice: Step-by-Step" },
      { type: "heading", level: 3, text: "Step 1: Upload Your Audio or Video File." },
      "Drag and drop your recording directly into DeVoice. The browser-based workflow works for creators who need to clean speech, singing, interviews, lessons, podcasts, or video audio without installing a desktop editor.",
      { type: "heading", level: 3, text: "Step 2: Let AI Separate Voice from Background Sound" },
      "DeVoice analyzes the file and reduces distracting noise or background conversation while keeping the main voice usable for listening, transcription, subtitles, and content repurposing.",
      { type: "heading", level: 3, text: "Step 3: Preview, Download, or Continue Working" },
      "After processing, review the cleaned result and keep the version that best fits your workflow. You can use the clearer audio as-is or turn it into text outputs for publishing and research.",
      { type: "heading", text: "Why Clean Audio Matters" },
      "Clean audio helps talent, ideas, and stories reach people without being buried under room noise, traffic, electronics, or nearby conversations. A clearer voice also improves downstream AI workflows such as transcription and summarization.",
      { type: "heading", text: "Final Thoughts" },
      "Background noise should not decide whether a creator can be heard. With free AI cleanup tools like DeVoice, more people can record, share, and repurpose their work even when their environment is not perfect."
    ]
  },
  {
    slug: "remove-background-music-from-audio",
    title: "How to Remove Background Music from Audio[Step by Step Guide]",
    category: "Blog",
    author: "helsel",
    date: "April 3, 2025",
    image: "/assets/blog/how-to-remove-background-music-from-audio.webp",
    imageAlt: "How to Remove Background Music from Audio[Step by Step Guide]",
    excerpt: "How to Remove Background Music from Audio In today's digital world, high-quality audio is crucial...",
    body: [
      "Background music can make narration feel cinematic, but it can also make speech harder to understand and harder to reuse. If you need captions, transcripts, clean voiceovers, or meeting notes, music under the speaker becomes a real problem.",
      "This step-by-step guide explains how to approach background music removal and how to decide whether you need a cleaner audio file, a transcript, subtitles, or a summary.",
      { type: "heading", text: "Step 1: Identify the Real Goal" },
      "Before processing, decide what output you need. If you are publishing audio, you may need a cleaner voice track. If you are researching or editing, a transcript may be enough. If you are posting video, subtitles may solve the accessibility problem.",
      { type: "heading", text: "Step 2: Test a Short Clip First" },
      "Use a small section of the recording before processing the full file. Listen for leftover music, missing words, robotic artifacts, or changes in the speaker's tone.",
      { type: "heading", text: "Step 3: Clean or Isolate the Voice" },
      "Run background noise removal or voice isolation depending on the source. Music that overlaps speech may not disappear completely, but reducing it can still make the voice easier to understand.",
      { type: "heading", text: "Step 4: Generate Text Outputs" },
      "Once the voice is clearer, create a transcript or subtitle file. Text outputs are often more useful than audio when you need editing notes, quotes, translations, summaries, or searchable records.",
      { type: "heading", text: "Step 5: Store and Reopen Results" },
      "Use My Resources to reopen completed jobs, review outputs, and continue working with previous recordings. This is helpful when testing multiple versions or comparing cleaned audio with text exports.",
      { type: "heading", text: "Best Practices" },
      "Keep speech close to the microphone, avoid loud music under important words, and reduce room echo before recording. AI cleanup works best when the target voice is already clear enough to identify.",
      { type: "heading", text: "Final Thoughts" },
      "Removing background music from audio is not always perfect, but it can make speech far more usable. DeVoice keeps the workflow focused on practical outputs: cleaner audio, transcripts, subtitles, summaries, and reusable resources."
    ]
  }
];

const blogPostAliases: Record<string, string> = {
  "download-youtube-videos-safely-efficiently": "how-to-download-youtube-videos",
  "ai-vocal-cleaner-one-click": "exploring-ai-vocal-cleaner-clean-up-audios",
  "extract-audio-from-video-online-free": "how-to-extract-audio-from-video",
  "top-ai-noise-remover-tools-2025": "ai-noise-remover-tools-for-dynamic-noise-reduction-online",
  "get-audio-from-video-2025": "how-to-get-the-audio-from-a-video",
  "remove-music-from-video": "how-to-remove-music-from-video",
  "remove-background-noise-and-conversation": "remove-background-noise-and-background-conversation"
};

export const staticPageConfigs: Record<StaticPageSlug, StaticPageConfig> = {
  blog: {
    title: "DeVoice Blog",
    description: "Guides, product updates and practical audio/video workflow articles from DeVoice.",
    sections: blogPosts.map((post) => [post.title, `Admin · ${post.date} · ${post.excerpt}`])
  },
  "privacy-policy": {
    title: "Privacy Policy",
    seoTitle: "Privacy Policy | DeVoice - Secure Online Audio Separation",
    description: "Effective Date: April 10, 2025. Last Updated: April 10, 2025.",
    sections: [
      ["1. What Information We Collect", "We collect account, usage, log and uploaded-file data needed to operate DeVoice and improve the service."],
      ["2. Cookies and Tracking Technologies", "Essential cookies keep the app working; analytics cookies help us understand product usage."],
      ["3. How We Use Your Data", "We use data to process files, maintain accounts, provide support, prevent abuse and improve AI workflows."],
      ["4. How We Share Your Data", "We do not sell personal data. Limited processors may help host, analyze or deliver the service."],
      ["5. Data Retention", "Uploaded files, transcripts and history may be retained for a limited period unless deleted sooner."],
      ["6. Your Rights and Choices", "You may request access, deletion or correction where applicable by contacting service@devoice.io."]
    ],
    blocks: [
      { type: "paragraph", text: "Effective Date: April 10, 2025" },
      { type: "paragraph", text: "Last Updated: April 10, 2025" },
      { type: "paragraph", text: "Welcome to DeVoice (https://devoice.io/), a free online platform dedicated to providing AI-powered audio separation services. At DeVoice, we take your privacy seriously. This Privacy Policy outlines how we collect, use, store, and protect your information when you visit our website or use our services." },
      { type: "paragraph", text: "By accessing or using DeVoice, you agree to the collection and use of your information in accordance with this Privacy Policy. If you do not agree with the terms herein, please do not use our services." },
      { type: "rule" },
      { type: "heading", text: "1. What Information We Collect" },
      { type: "paragraph", text: "DeVoice is designed to offer an easy, anonymous, and secure experience. We only collect data that is strictly necessary to operate and improve our services." },
      { type: "heading", level: 3, text: "a. User-Provided Data" },
      { type: "paragraph", text: "You are not required to create an account or provide personally identifiable information to use our core services. However, we may collect personal information under the following circumstances:" },
      { type: "list", items: ["If you contact us via email or through a contact form", "If you submit feedback or bug reports", "If you request customer support"] },
      { type: "paragraph", text: "In these cases, we may collect:" },
      { type: "list", items: ["Your email address (if provided)", "Your name (if included in your message)", "Content of your message or inquiry"] },
      { type: "paragraph", text: "We use this information solely to respond to your inquiries or improve our services." },
      { type: "heading", level: 3, text: "b. Uploaded Files" },
      { type: "paragraph", text: "When you upload audio or video files to DeVoice for processing, the following policies apply:" },
      { type: "list", items: ["Files are processed temporarily on our secure servers.", "All uploaded content will be discarded automatically when you leave this page.", "We do not use your content for training, analysis, or any secondary purposes.", "We do not share, publish, or store your files beyond what is needed for immediate processing."] },
      { type: "paragraph", text: "Your content remains your property, and we do not claim ownership of any audio or media you upload." },
      { type: "heading", level: 3, text: "c. Log and Usage Data" },
      { type: "paragraph", text: "To improve our website performance and troubleshoot technical issues, we automatically collect certain non-personal data, such as:" },
      { type: "list", items: ["IP address (short-term storage for anti-abuse and regional service optimization)", "Browser type and version", "Device type (desktop, tablet, mobile)", "Operating system", "Date and time of access", "Pages visited and buttons clicked", "Referring websites or links"] },
      { type: "rule" },
      { type: "heading", text: "2. Cookies and Tracking Technologies" },
      { type: "paragraph", text: "We use cookies and similar technologies to improve your experience and optimize website performance. Essential cookies support page navigation and security. Analytics cookies help us analyze traffic patterns, page performance, and user behavior." },
      { type: "rule" },
      { type: "heading", text: "3. How We Use Your Data" },
      { type: "list", items: ["To operate and maintain DeVoice services", "To process your uploaded audio or video files", "To troubleshoot and resolve technical issues", "To improve site design, speed, and user experience", "To monitor and prevent fraudulent or abusive activity", "To respond to support requests and comply with legal obligations"] },
      { type: "paragraph", text: "We do not use your data for targeted advertising, profiling, or resale to third parties." },
      { type: "rule" },
      { type: "heading", text: "4. How We Share Your Data" },
      { type: "paragraph", text: "We do not sell or rent your data. Your data may be shared with trusted third-party service providers only as necessary to deliver the service, including cloud storage, analytics, and security providers." },
      { type: "rule" },
      { type: "heading", text: "5. Data Retention" },
      { type: "list", items: ["Uploaded files: discarded automatically when you leave this page.", "Log and analytics data: retained for up to 90 days.", "Email correspondence: retained only as long as needed to resolve support issues."] },
      { type: "paragraph", text: "You may request deletion of your email-associated data anytime." },
      { type: "rule" },
      { type: "heading", text: "6. Your Rights and Choices" },
      { type: "paragraph", text: "Depending on your location, you may have the right to access your data, request deletion, correct inaccurate data, object to certain processing, and withdraw consent. To exercise any rights, email service@devoice.io." },
      { type: "rule" },
      { type: "heading", text: "7. Data Security" },
      { type: "paragraph", text: "We use HTTPS, encryption, firewalls, and secure servers to protect your data. However, no method is 100% secure. By using DeVoice, you acknowledge this risk." },
      { type: "rule" },
      { type: "heading", text: "8. Third-Party Links" },
      { type: "paragraph", text: "Our site may link to third-party sites. We are not responsible for their content or privacy practices. Please review their privacy policies before interacting." },
      { type: "rule" },
      { type: "heading", text: "9. Children's Privacy" },
      { type: "paragraph", text: "DeVoice is not intended for children under 13. If you believe a child has provided data, contact us and we will remove it." },
      { type: "rule" },
      { type: "heading", text: "10. Policy Updates" },
      { type: "paragraph", text: "We may update this Privacy Policy occasionally. We will update the date at the top of the page. Please review periodically." },
      { type: "rule" },
      { type: "heading", text: "11. Contact Us" },
      { type: "paragraph", text: "If you have questions or concerns, contact us at service@devoice.io or visit https://devoice.io/." }
    ]
  },
  "refund-policy": {
    title: "Refund Policy",
    seoTitle: "Refund Policy | DeVoice - AI Voice & Transcription Services",
    description: "Effective Date: March 18, 2026. Website: https://devoice.io.",
    sections: [
      ["1. Overview", "This policy governs purchases of subscriptions, credits and digital services on DeVoice."],
      ["2. General Rule: No Refunds", "Digital purchases are final once credits are used, outputs are generated or a billing cycle starts."],
      ["3. Subscription Plans", "Subscriptions renew according to the selected billing cycle and can be cancelled for future renewals."],
      ["4. Exceptional Refund Cases", "Duplicate charges, accidental charges or verified technical failure may be reviewed by support."],
      ["5. Non-Refundable Situations", "Used credits, generated outputs and completed service delivery are not refundable."],
      ["6. Chargebacks & Disputes", "Contact support first so we can investigate billing issues quickly."]
    ],
    blocks: [
      { type: "paragraph", text: "Effective Date: March 18, 2026" },
      { type: "paragraph", text: "Website: https://devoice.io" },
      { type: "heading", text: "1. Overview" },
      { type: "paragraph", text: "This Refund Policy governs all purchases made through DeVoice.io (\"we,\" \"our,\" or \"us\"), an online platform providing AI-powered voice and transcription services. By purchasing any subscription, credits, or services on DeVoice.io, you agree to this Refund Policy." },
      { type: "rule" },
      { type: "heading", text: "2. General Rule: No Refunds" },
      { type: "paragraph", text: "All purchases made on DeVoice.io are final and non-refundable, except as expressly stated in this policy. Due to the digital and instantly consumable nature of our services (including but not limited to voice generation, transcription, and credit usage), we do not offer refunds once:" },
      { type: "list", items: ["Credits have been used (partially or fully)", "A subscription billing cycle has started", "Any output has been generated using our services"] },
      { type: "rule" },
      { type: "heading", text: "3. Subscription Plans" },
      { type: "heading", level: 3, text: "3.1 Recurring Billing" },
      { type: "paragraph", text: "All subscription plans (monthly or annual) are billed automatically on a recurring basis. By subscribing, you authorize us to charge your payment method at the beginning of each billing cycle." },
      { type: "heading", level: 3, text: "3.2 Cancellation" },
      { type: "paragraph", text: "You may cancel your subscription at any time:" },
      { type: "list", items: ["Cancellation takes effect at the end of the current billing cycle", "You will not be charged for the next cycle", "No partial refunds will be issued for unused time"] },
      { type: "heading", level: 3, text: "3.3 No Prorated Refunds" },
      { type: "paragraph", text: "We do not provide prorated refunds for:" },
      { type: "list", items: ["Unused credits", "Partial subscription periods", "Downgrades during an active billing cycle"] },
      { type: "rule" },
      { type: "heading", text: "4. Exceptional Refund Cases" },
      { type: "paragraph", text: "We may, at our sole discretion, issue refunds in the following limited circumstances:" },
      { type: "heading", level: 3, text: "4.1 Duplicate or Accidental Charges" },
      { type: "paragraph", text: "If you were charged multiple times due to a technical error, you may request a refund within 7 days of the charge." },
      { type: "heading", level: 3, text: "4.2 Technical Failure" },
      { type: "paragraph", text: "If our service is completely unavailable or fails to function as intended, and you are unable to use any core features, you may request a refund within 7 days, provided:" },
      { type: "list", items: ["The issue is verified by our support team", "No significant usage has occurred"] },
      { type: "rule" },
      { type: "heading", text: "5. Non-Refundable Situations" },
      { type: "list", items: ["Change of mind after purchase", "Misunderstanding of features or capabilities", "Failure to cancel subscription before renewal", "Low usage or dissatisfaction without technical fault", "Temporary service interruptions or minor bugs", "Account suspension due to violation of our Terms of Service"] },
      { type: "rule" },
      { type: "heading", text: "6. Chargebacks & Disputes" },
      { type: "paragraph", text: "If you initiate a chargeback or payment dispute, we reserve the right to suspend or terminate your account, revoke access to remaining credits, and challenge the dispute with evidence. We strongly encourage users to contact us first." },
      { type: "rule" },
      { type: "heading", text: "7. How to Request a Refund" },
      { type: "paragraph", text: "To request a refund, contact service@devoice.io with your account email, transaction ID or receipt, and a description of the issue. We will review your request and respond within 3 business days." },
      { type: "rule" },
      { type: "heading", text: "8. Modifications to This Policy" },
      { type: "paragraph", text: "We reserve the right to modify this Refund Policy at any time. Changes take effect immediately upon posting on our website." },
      { type: "rule" },
      { type: "heading", text: "9. Governing Law" },
      { type: "paragraph", text: "This Refund Policy shall be governed and interpreted in accordance with the laws of the applicable jurisdiction where DeVoice.io operates." },
      { type: "rule" },
      { type: "heading", text: "10. Contact Information" },
      { type: "paragraph", text: "For any questions regarding this Refund Policy, contact service@devoice.io or visit https://devoice.io/." }
    ]
  },
  "terms-of-use": {
    title: "Terms of Use",
    seoTitle: "Terms of Use | DeVoice - Free & Pro Audio Vocal Remover",
    description: "Effective Date: April 10, 2025. Last Updated: April 10, 2025.",
    sections: [
      ["1. Acceptance of Terms", "By accessing DeVoice, you agree to these terms and confirm you can enter a binding agreement."],
      ["2. Description of Service", "DeVoice provides AI-powered transcription, subtitles, summaries, audio cleanup and voice generation tools."],
      ["3. User Tiers and Limits", "Free and paid users may have different credits, file limits, priority and feature access."],
      ["4. User Conduct and Responsibilities", "Users must own or have rights to the content they upload or process."],
      ["5. Copyright and Content Ownership", "You retain ownership of your content; DeVoice processes it to provide requested services."],
      ["6. Payment and Credits", "Credits may be required for generation, transcription, downloads or priority processing."],
      ["7. Disclaimer of Warranties", "Services are provided as available and may vary depending on file quality and provider availability."],
      ["8. Limitation of Liability", "DeVoice is not liable for indirect losses, misuse of generated content or unsupported workflows."]
    ],
    blocks: [
      { type: "paragraph", text: "Effective Date: April 10, 2025" },
      { type: "paragraph", text: "Last Updated: April 10, 2025" },
      { type: "paragraph", text: "Welcome to DeVoice (https://devoice.io/), a free and user-friendly platform for AI-powered audio separation. By accessing or using DeVoice, you agree to be bound by these Terms of Use. Please read them carefully." },
      { type: "paragraph", text: "If you do not agree with these terms, please do not use our website." },
      { type: "rule" },
      { type: "heading", text: "1. Acceptance of Terms" },
      { type: "paragraph", text: "By accessing or using the DeVoice website, tools, and services (the \"Service\"), you confirm that you are at least 13 years old and capable of entering into a legally binding agreement. If you are using DeVoice on behalf of an organization, you agree to these terms on behalf of that entity." },
      { type: "heading", text: "2. Description of Service" },
      { type: "paragraph", text: "DeVoice allows users to upload audio or video files and use AI to separate vocals and background music. This service is provided:" },
      { type: "list", items: ["Free of charge for basic users with usage limits", "With premium functionality available through a pay-per-use credit system"] },
      { type: "paragraph", text: "The platform is intended for personal, educational, and creative use. Commercial usage is permitted under fair use and content ownership compliance." },
      { type: "rule" },
      { type: "heading", text: "3. User Tiers and Limits" },
      { type: "heading", level: 3, text: "a. Free Users" },
      { type: "list", items: ["Limited to 1 audio processing per day", "Usage resets daily at midnight UTC", "Abuse (bots, VPN switching, automation) may result in bans"] },
      { type: "heading", level: 3, text: "b. Paid Users" },
      { type: "list", items: ["Users may purchase credits", "1 credit = 5 seconds of processing", "Partial usage rounded up to nearest 5 seconds", "Credits are non-refundable", "Credits tied to browser/session until accounts are introduced", "System abuse may result in restrictions"] },
      { type: "paragraph", text: "We reserve the right to adjust pricing or plan limits with notice." },
      { type: "rule" },
      { type: "heading", text: "4. User Conduct and Responsibilities" },
      { type: "paragraph", text: "You agree not to upload or process content that:" },
      { type: "list", items: ["Violates copyright laws", "You do not have permission to use", "Contains offensive, illegal, or harmful material", "Attempts to disrupt or overload our systems", "Attempts to reverse engineer or replicate the service"] },
      { type: "paragraph", text: "You are solely responsible for ensuring you have the right to upload and process your content." },
      { type: "rule" },
      { type: "heading", text: "5. Copyright and Content Ownership" },
      { type: "paragraph", text: "You retain all rights to the content you upload." },
      { type: "list", items: ["We do not own your media", "We process files only to deliver the service", "Files are automatically discarded when you leave or refresh the page", "We do not store your files on our servers"] },
      { type: "paragraph", text: "You agree not to process copyrighted material unless you have the right to do so." },
      { type: "rule" },
      { type: "heading", text: "6. Account Creation" },
      { type: "list", items: ["You must provide accurate information", "You are responsible for keeping login credentials secure", "We may suspend accounts that violate our terms"] },
      { type: "rule" },
      { type: "heading", text: "7. Payment and Credits" },
      { type: "paragraph", text: "Credit purchases are handled through secure third-party payment providers. All purchases are final and non-refundable. Credits are consumed based on processed audio duration and rounded to the nearest 5-second interval." },
      { type: "rule" },
      { type: "heading", text: "8. Disclaimer of Warranties" },
      { type: "paragraph", text: "DeVoice is provided \"as is\" and \"as available.\" We do not guarantee uninterrupted service, perfect results, or data accuracy." },
      { type: "rule" },
      { type: "heading", text: "9. Limitation of Liability" },
      { type: "paragraph", text: "DeVoice is not liable for loss of data, inaccurate audio results, unauthorized use of your content, or legal consequences from processing copyrighted material. Your use of DeVoice is at your own risk." },
      { type: "rule" },
      { type: "heading", text: "10. Termination" },
      { type: "paragraph", text: "We may suspend or terminate your access at any time for violations or harmful activity." },
      { type: "rule" },
      { type: "heading", text: "11. Modifications to the Service" },
      { type: "paragraph", text: "We may update or modify features, limits, pricing, or functionality at any time." },
      { type: "rule" },
      { type: "heading", text: "12. Privacy" },
      { type: "paragraph", text: "Your use of DeVoice is also governed by our Privacy Policy." },
      { type: "rule" },
      { type: "heading", text: "13. Copyright Infringement & DMCA" },
      { type: "paragraph", text: "If you believe your copyrighted material was used without permission, contact service@devoice.io with your name, contact details, description of the copyrighted work, link or reference to the alleged infringement, a good faith statement, and your signature." },
      { type: "rule" },
      { type: "heading", text: "14. Governing Law" },
      { type: "paragraph", text: "These Terms are governed by the laws of the jurisdiction in which DeVoice operates." },
      { type: "rule" },
      { type: "heading", text: "15. Contact Us" },
      { type: "paragraph", text: "For questions, feedback, or legal requests, contact service@devoice.io or visit https://devoice.io/." }
    ]
  }
};

export function getStaticPageConfig(slug: string) {
  return staticPageConfigs[slug as StaticPageSlug];
}

export function getBlogPost(slug: string) {
  const canonicalSlug = blogPostAliases[slug] ?? slug;
  return blogPosts.find((post) => post.slug === canonicalSlug);
}

export function DeVoiceStaticPage({ locale, config }: { locale: Locale; config: StaticPageConfig }) {
  const isBlog = config.title === "DeVoice Blog";
  const policyBlocks: PolicyBlock[] =
    config.blocks ?? config.sections.flatMap(([title, text]) => [{ type: "heading", text: title }, { type: "paragraph", text }]);

  return (
    <DeVoiceShell locale={locale}>
      <section className={isBlog ? "staticPage staticBlogPage" : "staticPage policyPage"}>
        {isBlog ? (
          <>
            <h1 className="staticBlogTitle">DeVoice Blog</h1>
            <div className="blogGrid">
              {blogPosts.map((post) => (
                <article className="blogCard" key={post.slug}>
                  <a className="blogImageLink" href={localizedPath(locale, `blog/${post.slug}`)}>
                    <img src={post.image} alt={post.imageAlt} />
                  </a>
                  <div className="blogCardBody">
                    <p className="blogCategory">{post.category}</p>
                    <a href={localizedPath(locale, `blog/${post.slug}`)}>
                      <h2>{post.title}</h2>
                    </a>
                    <p className="blogMeta">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                    </p>
                    <p className="blogExcerpt">{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1>{config.title}</h1>
            <div className="policyDocument">
              {policyBlocks.map((block, index) => {
                if (block.type === "rule") {
                  return <hr key={`${block.type}-${index}`} />;
                }

                if (block.type === "heading") {
                  if (block.level === 3) {
                    return <h3 key={`${block.text}-${index}`}>{block.text}</h3>;
                  }
                  return <h2 key={`${block.text}-${index}`}>{block.text}</h2>;
                }

                if (block.type === "list") {
                  return (
                    <ul key={`${block.type}-${index}`}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }

                return <p key={`${block.text}-${index}`}>{block.text}</p>;
              })}
            </div>
          </>
        )}
      </section>
      <DeVoiceFooter locale={locale} />
    </DeVoiceShell>
  );
}

export function DeVoiceBlogPostPage({ locale, post }: { locale: Locale; post: BlogPost }) {
  const legacyH2 = new Set([
    "Other Real-Life Scenarios Where Downloading YouTube Videos Makes Sense",
    "How to download YouTube videos legally",
    "Five Tools for How to Download YouTube Videos",
    "How to Download YouTube Videos Safely with DeVoice",
    "Key Legal Reminders",
    "Final Thoughts: Choosing the Right Way to Download YouTube Videos"
  ]);
  const legacyH3 = new Set([
    "Travel: Offline Learning & Entertainment on the Go",
    "Students: Offline Access for Study & Exam Prep"
  ]);

  return (
    <DeVoiceShell locale={locale}>
      <article className="staticPage blogPostPage policyPage">
        <h1>{post.title}</h1>
        {post.showHeroImage !== false ? (
          <div className="blogPostHero" aria-label={post.imageAlt}>
            <img src={post.image} alt={post.imageAlt} />
          </div>
        ) : null}
        <div className="policyDocument">
          {post.body.map((block, index) => {
            if (typeof block !== "string") {
              if (block.type === "heading") {
                return block.level === 3 ? <h3 key={`${block.text}-${index}`}>{block.text}</h3> : <h2 key={`${block.text}-${index}`}>{block.text}</h2>;
              }

              return <p key={`${block.text}-${index}`}>{block.text}</p>;
            }

            if (legacyH2.has(block)) {
              return <h2 key={`${block}-${index}`}>{block}</h2>;
            }

            if (legacyH3.has(block)) {
              return <h3 key={`${block}-${index}`}>{block}</h3>;
            }

            return <p key={`${block}-${index}`}>{block}</p>;
          })}
        </div>
      </article>
      <DeVoiceFooter locale={locale} />
    </DeVoiceShell>
  );
}
