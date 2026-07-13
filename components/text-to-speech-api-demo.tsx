"use client";

import { useMemo, useState } from "react";

type DemoJob = {
  id: string;
  sourceType: string;
  status: string;
  provider?: string | null;
  transcript?: string | null;
  summary?: string | null;
  createdAt?: string;
};

const speakers = [
  {
    label: "Candice — American English — en_female_candice_emo_v2_mars_bigtts",
    value: "en_female_candice_emo_v2_mars_bigtts",
    localVoiceId: "sonia"
  },
  {
    label: "Ryan — British English — en_male_ryan_neural",
    value: "en_male_ryan_neural",
    localVoiceId: "ryan"
  },
  {
    label: "Libby — British English — en_female_libby_neural",
    value: "en_female_libby_neural",
    localVoiceId: "libby"
  }
];

export function TextToSpeechApiDemo() {
  const [language, setLanguage] = useState("en");
  const [text, setText] = useState("Hello, this is a text-to-speech API test.");
  const [speaker, setSpeaker] = useState(speakers[0].value);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [job, setJob] = useState<DemoJob | null>(null);
  const [rawResponse, setRawResponse] = useState("");

  const selectedSpeaker = useMemo(() => speakers.find((item) => item.value === speaker) ?? speakers[0], [speaker]);

  async function createAndPoll() {
    setBusy(true);
    setStatus("Creating job...");
    setJob(null);
    setRawResponse("");

    try {
      const createResponse = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "text_to_speech",
          sourceUrl: `data:text/plain,${encodeURIComponent(text)}`,
          fileName: "text-to-speech-api-demo.txt",
          language,
          targetLanguage: selectedSpeaker.localVoiceId
        })
      });

      const createData = await createResponse.json().catch(() => null) as { job?: { id: string }; error?: string } | null;
      if (!createResponse.ok || !createData?.job?.id) {
        throw new Error(createData?.error ?? `createJobPost failed with HTTP ${createResponse.status}`);
      }

      setStatus(`Polling textToSpeechGet for ${createData.job.id}...`);
      let latest: DemoJob | null = null;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const pollResponse = await fetch(`/api/jobs/${createData.job.id}`);
        const pollData = await pollResponse.json().catch(() => null) as { job?: DemoJob; error?: string } | null;
        if (!pollResponse.ok || !pollData?.job) {
          throw new Error(pollData?.error ?? `textToSpeechGet failed with HTTP ${pollResponse.status}`);
        }

        latest = pollData.job;
        if (latest.status !== "queued" && latest.status !== "processing") break;
        await new Promise((resolve) => window.setTimeout(resolve, 700));
      }

      setJob(latest);
      setRawResponse(JSON.stringify(latest, null, 2));
      setStatus(latest ? `Done: ${latest.status}` : "No job returned.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create text-to-speech job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ttsApiDemoPage" aria-labelledby="tts-api-demo-title">
      <div className="ttsApiDemoHeader">
        <h1 id="tts-api-demo-title">Text-to-speech API demo</h1>
        <p>
          Internal test: <code>createJobPost</code> → poll <code>textToSpeechGet</code>. Route:{" "}
          <code>/demo/text-to-speech</code>
        </p>
      </div>

      <div className="ttsApiDemoCard">
        <label>
          <span>Language</span>
          <input value={language} onChange={(event) => setLanguage(event.target.value)} />
        </label>

        <label>
          <span>Text</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>

        <label>
          <span>Speaker</span>
          <select value={speaker} onChange={(event) => setSpeaker(event.target.value)}>
            {speakers.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={createAndPoll} disabled={busy || !text.trim()}>
          {busy ? "Creating..." : "Create job & poll"}
        </button>

        {status ? <p className="ttsApiDemoStatus">{status}</p> : null}
        {job ? (
          <div className="ttsApiDemoResult">
            <a href={`/jobs/${job.id}`}>Open result</a>
            <span>{job.provider ?? "DeVoice demo TTS engine"}</span>
          </div>
        ) : null}
        {rawResponse ? <pre>{rawResponse}</pre> : null}
      </div>
    </section>
  );
}
