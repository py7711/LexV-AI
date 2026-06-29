"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

type QueueCounts = Record<string, number>;

export function QueueStatus({ locale }: { locale: string }) {
  const isZh = locale.startsWith("zh");
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    const response = await fetch("/api/queue/status");
    const data = (await response.json()) as { configured?: boolean; counts?: QueueCounts | null; message?: string; error?: string };

    if (!response.ok || !data.configured) {
      setMessage(data.error ?? data.message ?? "队列状态不可用。");
      setCounts(null);
      return;
    }

    setCounts(data.counts ?? {});
    setMessage("");
  }

  return (
    <div className="opsPanel">
      <h2>
        <Activity size={20} aria-hidden="true" />
        {isZh ? "处理队列状态" : "Processing queue status"}
      </h2>
      <button className="btn" type="button" onClick={loadStatus}>
        {isZh ? "刷新处理状态" : "Refresh processing"}
      </button>
      {message ? <p className="formMessage">{message}</p> : null}
      {counts ? (
        <div className="queueCounts">
          {Object.entries(counts).map(([key, value]) => (
            <span key={key}>
              <strong>{value}</strong>
              {key}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
