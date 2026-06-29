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
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-download-youtube-videos",
    title: "How to Download YouTube Videos Safely & Efficiently | DeVoice",
    category: "Blog",
    author: "Admin",
    date: "December 19, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/how-to-download-youtube-videos-safely-efficiently.webp",
    imageAlt: "How to Download YouTube Videos Safely & Efficiently|DeVoice",
    excerpt: "Learn how to download YouTube videos safely, quickly, and ad-free with DeVoice. Get high-quality MP4 files without malware or privacy risks.",
    body: [
      "Start with the simplest legal workflow: use the creator's download option, YouTube's offline features, or content you own and have permission to reuse.",
      "For research and repurposing, DeVoice focuses on transcript and summary workflows. Paste a public YouTube URL, generate readable text, then export notes without storing a full video file.",
      "When you need captions, use the subtitle downloader to produce SRT, VTT or TXT style text that can be edited, translated and attached to your own projects."
    ]
  },
  {
    slug: "exploring-ai-vocal-cleaner-clean-up-audios",
    title: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click",
    category: "Blog",
    author: "Admin",
    date: "July 4, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/ai-voice-cleaner.webp",
    imageAlt: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click",
    excerpt: "Exploring AI Vocal Cleaner: Clean Up Audios & Videos in One Click In the dynamic...",
    body: [
      "AI vocal cleaning works by separating speech from unwanted background sound. It is useful for interviews, courses, podcasts, calls and video recordings captured outside a studio.",
      "Upload a noisy audio or video file to DeVoice, run background noise removal, then review the cleaned result before exporting.",
      "For best quality, start with the clearest source possible. Short tests help you find the right workflow before processing longer files."
    ]
  },
  {
    slug: "how-to-extract-audio-from-video",
    title: "How to Extract Audio from Video Online for Free with DeVoice",
    category: "Blog",
    author: "Admin",
    date: "June 19, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/how-to-extract-audio-from-video.webp",
    imageAlt: "How to Extract Audio from Video Online for Free with DeVoice",
    excerpt: "How to Extract Audio from Video Online for Free with DeVoice In today's digital era,...",
    body: [
      "Video files often contain the most valuable spoken content. DeVoice lets you upload a video and process its audio track for transcription, cleanup or summarization.",
      "Choose Video To Text when you need editable transcripts. Choose Remove Background Noise when the audio track needs cleaning before publishing.",
      "After processing, open the resource result page to export text, subtitles or summary content for downstream editing."
    ]
  },
  {
    slug: "ai-noise-remover-tools-for-dynamic-noise-reduction-online",
    title: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025",
    category: "Blog",
    author: "Admin",
    date: "June 6, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/ai-tools-for-ai-noise-reduction-online.webp",
    imageAlt: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025",
    excerpt: "Top 5 AI Noise Remover Tools for Dynamic Noise Reduction Online in 2025 In today's...",
    body: [
      "The best AI noise removers are fast, easy to use, and tuned for speech clarity rather than heavy-handed filtering.",
      "Compare tools by upload limits, supported formats, preview quality, export options and privacy policies.",
      "DeVoice keeps the workflow compact: upload the file, remove background noise, preview the cleaned result and store it in My Resources."
    ]
  },
  {
    slug: "how-to-get-the-audio-from-a-video",
    title: "How to Get the Audio from a Video in 2025: 6 Easy Methods",
    category: "Blog",
    author: "Admin",
    date: "May 6, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/how-to-get-the-audio-from-a-video.webp",
    imageAlt: "How to Get the Audio from a Video in 2025: 6 Easy Methods",
    excerpt: "How to Get the Audio from a Video in 2025 with 6 Easy Methods Extracting...",
    body: [
      "You can get value from video audio by extracting the audio file, creating a transcript, generating captions, or summarizing the spoken content.",
      "For meetings and lectures, transcription is usually more useful than a raw audio export because it makes the content searchable.",
      "For noisy creator footage, run cleanup first, then generate text or voice assets from the improved audio."
    ]
  },
  {
    slug: "remove-lead-vocals-from-songs",
    title: "Remove Lead Vocals from Songs with DeVoice [Ultimate Guide]",
    category: "Blog",
    author: "Admin",
    date: "April 17, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/free-remove-lead-vocals-from-songs-with-devoice.webp",
    imageAlt: "Remove Lead Vocals from Songs with DeVoice [Ultimate Guide]",
    excerpt: "Remove Lead Vocals from Songs Online for Free with DeVoice [Ultimate Guide] Removing vocals from...",
    body: [
      "Vocal separation attempts to isolate vocal frequencies and speech-like patterns from a mixed track. Results depend heavily on the source material.",
      "Use vocal separation and cleanup responsibly, especially when music rights or commercial redistribution are involved.",
      "For speech-first recordings, DeVoice background noise removal is tuned to improve clarity for podcasts, meetings and videos."
    ]
  },
  {
    slug: "how-to-remove-music-from-video",
    title: "How to Remove Music from Video [2025's Top 10 Tools]",
    category: "Blog",
    author: "Admin",
    date: "April 9, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/how-to-remove-music-top-tools.webp",
    imageAlt: "How to Remove Music from Video [2025's Top 10 Tools]",
    excerpt: "How to Remove Music from Video [10 Best Online Tools] Question:\"How do I remove music...",
    body: [
      "Removing music from video is harder than removing steady room noise because music overlaps speech across many frequencies.",
      "Start by testing a short clip. If speech remains intelligible after cleanup, process the full video and export a clean transcript or audio track.",
      "When music cannot be fully removed, a transcript may still capture the important spoken content for editing and documentation."
    ]
  },
  {
    slug: "remove-background-noise-and-background-conversation",
    title: "Ultimate Guide to Remove Background Noise and Conversation",
    category: "Blog",
    author: "Admin",
    date: "April 9, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/remove-background-noise.webp",
    imageAlt: "Ultimate Guide to Remove Background Noise and Conversation",
    excerpt: "Ultimate Guide to Remove Background Noise and Conversation in 2025 In early 2025, a 15-year-old...",
    body: [
      "Background conversation is one of the hardest noises to remove because it resembles the target voice. Good microphone placement matters.",
      "Record close to the speaker, avoid reflective rooms, and capture a short test before the main session.",
      "After recording, use DeVoice noise removal and review the result. For important content, generate a transcript so the final message stays clear even when audio is imperfect."
    ]
  },
  {
    slug: "remove-background-music-from-audio",
    title: "How to Remove Background Music from Audio[Step by Step Guide]",
    category: "Blog",
    author: "helsel",
    date: "April 3, 2025",
    image: "https://cdn.devoice.io/ai_devoice/nuxt_img/blog/how-to-remove-background-music-from-audio.webp",
    imageAlt: "How to Remove Background Music from Audio[Step by Step Guide]",
    excerpt: "How to Remove Background Music from Audio In today's digital world, high-quality audio is crucial...",
    body: [
      "Background music can make interviews, narration and creator footage harder to reuse. A cleanup workflow starts with a short test clip, then scales to the full recording.",
      "Use DeVoice to process the audio, preview the result, and keep the final file or transcript in your resources.",
      "For best results, keep speech close to the microphone and avoid music that overlaps the vocal range."
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
      { type: "paragraph", text: "At DeVoice, accessible from https://devoice.io/, your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal and uploaded data when you use our AI-powered audio separation tools." },
      { type: "rule" },
      { type: "heading", text: "1. What Information We Collect" },
      { type: "heading", level: 3, text: "a. Personal Information" },
      { type: "paragraph", text: "You are not required to create an account or provide personally identifiable information to use our core services. However, we may collect personal information under the following circumstances:" },
      { type: "list", items: ["If you contact us via email or through a contact form", "If you submit feedback or bug reports", "If you request customer support"] },
      { type: "paragraph", text: "In these cases, we may collect your email address, your name if included in your message, and the content of your message or inquiry. We use this information solely to respond to your inquiries or improve our services." },
      { type: "heading", level: 3, text: "b. Uploaded Files" },
      { type: "paragraph", text: "When you upload audio or video files to DeVoice for processing, files are processed temporarily on our secure servers and discarded automatically when you leave the page." },
      { type: "list", items: ["We do not use your content for training, analysis, or any secondary purposes.", "We do not share, publish, or store your files beyond what is needed for immediate processing.", "Your content remains your property, and we do not claim ownership of any audio or media you upload."] },
      { type: "heading", level: 3, text: "c. Log and Usage Data" },
      { type: "paragraph", text: "To improve website performance and troubleshoot technical issues, we automatically collect non-personal data such as IP address, browser and device type, operating system, access time, pages visited, buttons clicked, and referring websites." },
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
      { type: "paragraph", text: "This Refund Policy governs all purchases made through DeVoice.io, an online platform providing AI-powered voice and transcription services. By purchasing any subscription, credits, or services on DeVoice.io, you agree to this Refund Policy." },
      { type: "rule" },
      { type: "heading", text: "2. General Rule: No Refunds" },
      { type: "paragraph", text: "All purchases made on DeVoice.io are final and non-refundable, except as expressly stated in this policy. Due to the digital and instantly consumable nature of our services, we do not offer refunds once:" },
      { type: "list", items: ["Credits have been used, partially or fully", "A subscription billing cycle has started", "Any output has been generated using our services"] },
      { type: "rule" },
      { type: "heading", text: "3. Subscription Plans" },
      { type: "heading", level: 3, text: "3.1 Recurring Billing" },
      { type: "paragraph", text: "All subscription plans are billed automatically on a recurring basis. By subscribing, you authorize us to charge your payment method at the beginning of each billing cycle." },
      { type: "heading", level: 3, text: "3.2 Cancellation" },
      { type: "list", items: ["Cancellation takes effect at the end of the current billing cycle", "You will not be charged for the next cycle", "No partial refunds will be issued for unused time"] },
      { type: "heading", level: 3, text: "3.3 No Prorated Refunds" },
      { type: "list", items: ["Unused credits", "Partial subscription periods", "Downgrades during an active billing cycle"] },
      { type: "rule" },
      { type: "heading", text: "4. Exceptional Refund Cases" },
      { type: "paragraph", text: "We may, at our sole discretion, issue refunds for duplicate or accidental charges requested within 7 days, or verified technical failure when no significant usage has occurred." },
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
      { type: "paragraph", text: "Welcome to DeVoice (https://devoice.io/), a free and user-friendly platform for AI-powered audio separation. By accessing or using DeVoice, you agree to be bound by these Terms of Use." },
      { type: "paragraph", text: "If you do not agree with these terms, please do not use our website." },
      { type: "rule" },
      { type: "heading", text: "1. Acceptance of Terms" },
      { type: "paragraph", text: "By accessing or using the DeVoice website, tools, and services, you confirm that you are at least 13 years old and capable of entering into a legally binding agreement." },
      { type: "heading", text: "2. Description of Service" },
      { type: "paragraph", text: "DeVoice allows users to upload audio or video files and use AI to separate vocals and background music. This service is provided free of charge for basic users with usage limits, with premium functionality available through a pay-per-use credit system." },
      { type: "list", items: ["Free of charge for basic users with usage limits", "Premium functionality available through a pay-per-use credit system"] },
      { type: "paragraph", text: "The platform is intended for personal, educational, and creative use. Commercial usage is permitted under fair use and content ownership compliance." },
      { type: "rule" },
      { type: "heading", text: "3. User Tiers and Limits" },
      { type: "heading", level: 3, text: "a. Free Users" },
      { type: "list", items: ["Limited to 1 audio processing per day", "Usage resets daily at midnight UTC", "Abuse such as bots, VPN switching, or automation may result in bans"] },
      { type: "heading", level: 3, text: "b. Paid Users" },
      { type: "list", items: ["Users may purchase credits", "1 credit = 5 seconds of processing", "Partial usage rounded up to nearest 5 seconds", "Credits are non-refundable", "Credits tied to browser/session until accounts are introduced", "System abuse may result in restrictions"] },
      { type: "paragraph", text: "We reserve the right to adjust pricing or plan limits with notice." },
      { type: "rule" },
      { type: "heading", text: "4. User Conduct and Responsibilities" },
      { type: "paragraph", text: "You agree not to upload or process content that violates copyright laws, lacks permission, contains offensive or illegal material, disrupts our systems, or attempts to reverse engineer the service." },
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
  return (
    <DeVoiceShell locale={locale}>
      <article className="staticPage blogPostPage policyPage">
        <a className="backLink" href={localizedPath(locale, "blog")}>Blog</a>
        <div className="blogPostHero">
          <img src={post.image} alt={post.imageAlt} />
          <h1>{post.title}</h1>
          <p>{post.author} · {post.date}</p>
        </div>
        <div className="policyDocument">
          <h2>{post.excerpt}</h2>
          <div>
            {post.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
      <DeVoiceFooter locale={locale} />
    </DeVoiceShell>
  );
}
