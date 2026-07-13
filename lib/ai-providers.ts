import { runWithFallback } from "@/lib/provider-fallback";

export type TranscriptResult = {
  transcript: string;
  subtitles?: string;
  durationSec?: number;
};

export type SummaryResult = {
  summary: string;
  chapters: Array<{ title: string; startSec?: number }>;
  keywords: string[];
  mindMap?: {
    root: string;
    nodes: Array<{ title: string; children?: string[] }>;
  };
};

type AssemblyTranscript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
  audio_duration?: number;
};

type MediaInput = {
  mediaUrl?: string;
  media?: {
    bytes: Uint8Array;
    fileName?: string | null;
    contentType?: string | null;
  };
  language?: string;
};

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function postJson<T>(url: string, headers: Record<string, string>, body: unknown): Promise<T> {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function fetchMediaBlob(input: MediaInput, timeoutMs = 120000) {
  if (input.media?.bytes) {
    return {
      blob: new Blob([bytesToArrayBuffer(input.media.bytes)], {
        type: input.media.contentType ?? "application/octet-stream"
      }),
      fileName: input.media.fileName ?? "devoice-media"
    };
  }

  if (!input.mediaUrl) {
    throw new Error("缺少可读取的媒体 URL 或媒体字节。");
  }

  const mediaResponse = await fetchWithTimeout(input.mediaUrl, {}, timeoutMs);
  if (!mediaResponse.ok) {
    throw new Error(`拉取媒体失败：HTTP ${mediaResponse.status}`);
  }

  return {
    blob: await mediaResponse.blob(),
    fileName: input.mediaUrl.split("/").pop() || "devoice-media"
  };
}

async function uploadAssemblyMedia(input: MediaInput, token: string) {
  if (!input.media?.bytes) {
    if (!input.mediaUrl) throw new Error("AssemblyAI 缺少可读取的媒体 URL。");
    return input.mediaUrl;
  }

  const response = await fetchWithTimeout(
    "https://api.assemblyai.com/v2/upload",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/octet-stream"
      },
      body: bytesToArrayBuffer(input.media.bytes)
    },
    Number(process.env.ASSEMBLYAI_UPLOAD_TIMEOUT_MS ?? 180000)
  );

  if (!response.ok) {
    throw new Error(`AssemblyAI 上传失败：HTTP ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { upload_url?: string };
  if (!data.upload_url) {
    throw new Error("AssemblyAI 上传未返回 upload_url。");
  }

  return data.upload_url;
}

function normalizeSummary(value: unknown): SummaryResult {
  const fallback: SummaryResult = {
    summary: "",
    chapters: [],
    keywords: []
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const chapters: SummaryResult["chapters"] = [];
  if (Array.isArray(record.chapters)) {
    for (const item of record.chapters) {
      if (!item || typeof item !== "object") continue;
      const chapter = item as Record<string, unknown>;
      const title = String(chapter.title ?? "");
      if (!title) continue;
      chapters.push({
        title,
        startSec: typeof chapter.startSec === "number" ? chapter.startSec : undefined
      });
    }
  }

  const keywords = Array.isArray(record.keywords) ? record.keywords.map((item) => String(item)) : [];

  return {
    summary: String(record.summary ?? record.overview ?? ""),
    chapters,
    keywords,
    mindMap: typeof record.mindMap === "object" && record.mindMap ? record.mindMap as SummaryResult["mindMap"] : undefined
  };
}

function parseJsonFromModel(content: string): SummaryResult {
  const cleaned = content
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return normalizeSummary(JSON.parse(cleaned));
  } catch {
    // 模型偶尔会返回自然语言；这里保留摘要文本，避免整条任务因为 JSON 细节失败。
    return {
      summary: cleaned,
      chapters: [],
      keywords: []
    };
  }
}

function secondsToSrtTime(seconds: number) {
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = Math.floor(seconds % 60);
  const millisecond = Math.floor((seconds - Math.floor(seconds)) * 1000);

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")},${String(
    millisecond
  ).padStart(3, "0")}`;
}

function buildSimpleSrt(transcript: string, durationSec = 30) {
  const chunks = transcript.match(/.{1,80}(\s|$)/g) ?? [transcript];
  const perChunk = Math.max(2, durationSec / chunks.length);

  return chunks
    .map((chunk, index) => {
      const start = index * perChunk;
      const end = start + perChunk;
      return `${index + 1}\n${secondsToSrtTime(start)} --> ${secondsToSrtTime(end)}\n${chunk.trim()}`;
    })
    .join("\n\n");
}

async function pollAssemblyTranscript(id: string, token: string) {
  const maxPolls = Number(process.env.ASSEMBLYAI_MAX_POLLS ?? 30);
  const delayMs = Number(process.env.ASSEMBLYAI_POLL_INTERVAL_MS ?? 3000);

  for (let index = 0; index < maxPolls; index += 1) {
    const response = await fetchWithTimeout(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { Authorization: token }
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI 查询失败：HTTP ${response.status}`);
    }

    const data = (await response.json()) as AssemblyTranscript;
    if (data.status === "completed") {
      if (!data.text) throw new Error("AssemblyAI 完成但未返回文本");
      return data;
    }
    if (data.status === "error") {
      throw new Error(data.error ?? "AssemblyAI 转写失败");
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("AssemblyAI 转写轮询超时");
}

async function transcribeWithGroq(input: MediaInput) {
  const token = process.env.GROQ_API_KEY;
  if (!token) throw new Error("未配置 GROQ_API_KEY");

  const media = await fetchMediaBlob(input, Number(process.env.GROQ_MEDIA_FETCH_TIMEOUT_MS ?? 120000));
  const formData = new FormData();
  formData.set("model", process.env.GROQ_TRANSCRIBE_MODEL ?? "whisper-large-v3-turbo");
  formData.set("response_format", "verbose_json");
  if (input.language) {
    formData.set("language", input.language);
  }
  formData.set("file", media.blob, media.fileName);

  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    },
    Number(process.env.GROQ_TRANSCRIBE_TIMEOUT_MS ?? 180000)
  );

  if (!response.ok) {
    throw new Error(`Groq HTTP ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { text?: string; duration?: number };
  if (!data.text) throw new Error("Groq 未返回转写文本");

  return {
    transcript: data.text,
    durationSec: data.duration,
    subtitles: buildSimpleSrt(data.text, data.duration)
  };
}

export async function transcribeWithFallback(input: MediaInput) {
  return runWithFallback<TranscriptResult>([
    {
      name: "Deepgram",
      run: async () => {
        const token = process.env.DEEPGRAM_API_KEY;
        if (!token) throw new Error("未配置 DEEPGRAM_API_KEY");
        const endpoint = "https://api.deepgram.com/v1/listen?smart_format=true&punctuate=true";
        let data: {
          metadata?: { duration?: number };
          results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
        };
        if (input.media?.bytes) {
          const response = await fetchWithTimeout(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": input.media.contentType ?? "application/octet-stream"
            },
            body: bytesToArrayBuffer(input.media.bytes)
          });
          if (!response.ok) throw new Error(`Deepgram HTTP ${response.status} ${await response.text()}`);
          data = (await response.json()) as typeof data;
        } else {
          if (!input.mediaUrl) throw new Error("Deepgram 缺少可读取的媒体 URL。");
          data = await postJson<typeof data>(
            endpoint,
            { Authorization: `Token ${token}` },
            { url: input.mediaUrl }
          );
        }
        const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
        if (!transcript) throw new Error("Deepgram 未返回转写文本");
        return {
          transcript,
          durationSec: data.metadata?.duration,
          subtitles: buildSimpleSrt(transcript, data.metadata?.duration)
        };
      }
    },
    {
      name: "AssemblyAI",
      run: async () => {
        const token = process.env.ASSEMBLYAI_API_KEY;
        if (!token) throw new Error("未配置 ASSEMBLYAI_API_KEY");
        const audioUrl = await uploadAssemblyMedia(input, token);
        const created = await postJson<{ id: string }>(
          "https://api.assemblyai.com/v2/transcript",
          { Authorization: token },
          { audio_url: audioUrl, language_code: input.language }
        );
        const completed = await pollAssemblyTranscript(created.id, token);
        return {
          transcript: completed.text!,
          durationSec: completed.audio_duration,
          subtitles: buildSimpleSrt(completed.text!, completed.audio_duration)
        };
      }
    },
    {
      name: "Groq Whisper",
      run: async () => transcribeWithGroq(input)
    }
  ]);
}

export async function summarizeWithFallback(input: { transcript: string; locale?: string }) {
  const transcript = input.transcript.trim();
  const prompt = `Please turn the following DeVoice transcript into a concise media summary, chapters, keywords, and a small mind map. Return JSON only in this format: {"summary":"...","chapters":[{"title":"...","startSec":0}],"keywords":["..."],"mindMap":{"root":"...","nodes":[{"title":"...","children":["..."]}]}}.\n\n${transcript.slice(0, 12000)}`;
  const localSummary = () => buildExtractiveSummary(transcript);

  return runWithFallback<SummaryResult>([
    {
      name: "DeepSeek Summary",
      run: async () => {
        const token = process.env.DEEPSEEK_API_KEY;
        if (!token) throw new Error("未配置 DEEPSEEK_API_KEY");
        const data = await postJson<{ choices?: Array<{ message?: { content?: string } }> }>(
          process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions",
          { Authorization: `Bearer ${token}` },
          {
            model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4",
            messages: [
              {
                role: "system",
                content: "You create structured media summaries for DeVoice. Return strict JSON only."
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          }
        );
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("DeepSeek 未返回摘要");
        return parseJsonFromModel(content);
      }
    },
    {
      name: "Gemini Summary",
      run: async () => {
        const token = process.env.GEMINI_API_KEY;
        if (!token) throw new Error("未配置 GEMINI_API_KEY");
        const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
        const data = await postJson<{
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        }>(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(token)}`,
          {},
          {
            generationConfig: {
              responseMimeType: "application/json"
            },
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ]
          }
        );
        const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
        if (!content) throw new Error("Gemini 未返回摘要");
        return parseJsonFromModel(content);
      }
    },
    {
      name: "AssemblyAI LeMUR",
      run: async () => {
        const token = process.env.ASSEMBLYAI_API_KEY;
        if (!token) throw new Error("未配置 ASSEMBLYAI_API_KEY");
        const data = await postJson<{ response?: string }>(
          "https://api.assemblyai.com/lemur/v3/generate/task",
          { Authorization: token },
          {
            prompt,
            input_text: transcript.slice(0, 120000),
            final_model: process.env.ASSEMBLYAI_LEMUR_MODEL ?? "anthropic/claude-3-5-sonnet"
          }
        );
        const content = data.response;
        if (!content) throw new Error("DeepSeek 未返回摘要");
        return parseJsonFromModel(content);
      }
    },
    {
      name: "Groq Summary",
      run: async () => {
        const token = process.env.GROQ_API_KEY;
        if (!token) throw new Error("未配置 GROQ_API_KEY");
        const data = await postJson<{ choices?: Array<{ message?: { content?: string } }> }>(
          "https://api.groq.com/openai/v1/chat/completions",
          { Authorization: `Bearer ${token}` },
          {
            model: process.env.GROQ_SUMMARY_MODEL ?? "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          }
        );
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Groq 未返回摘要");
        return parseJsonFromModel(content);
      }
    },
    {
      name: "Deepgram Intelligence",
      run: async () => {
        const token = process.env.DEEPGRAM_API_KEY;
        if (!token) throw new Error("未配置 DEEPGRAM_API_KEY");
        if (!transcript) throw new Error("没有可摘要的转写文本");
        return localSummary();
      }
    }
  ]);
}

function buildExtractiveSummary(transcript: string): SummaryResult {
  const sentences = transcript
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const summary = (sentences.slice(0, 3).join(" ") || transcript.slice(0, 320)).trim();
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
  const chapters = sentences.slice(0, 5).map((sentence, index) => ({
    title: sentence.slice(0, 96),
    startSec: index * 60
  }));

  return {
    summary,
    chapters,
    keywords,
    mindMap: {
      root: "Media Summary",
      nodes: [
        { title: "Overview", children: summary ? [summary.slice(0, 120)] : [] },
        { title: "Keywords", children: keywords }
      ]
    }
  };
}
