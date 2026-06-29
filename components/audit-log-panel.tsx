"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";

type AuditLog = {
  id: string;
  actorType: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export function AuditLogPanel({ locale }: { locale: string }) {
  const isZh = locale.startsWith("zh");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");

  async function loadLogs() {
    const response = await fetch("/api/audit-logs");
    const data = (await response.json()) as { logs?: AuditLog[]; error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "审计日志加载失败。");
      return;
    }
    setLogs(data.logs ?? []);
    setMessage("");
  }

  return (
    <div className="opsPanel auditPanel">
      <h2>
        <ScrollText size={20} aria-hidden="true" />
        {isZh ? "活动记录" : "Activity history"}
      </h2>
      <button className="btn" type="button" onClick={loadLogs}>
        {isZh ? "刷新审计日志" : "Refresh logs"}
      </button>
      {message ? <p className="formMessage">{message}</p> : null}
      <div className="auditList">
        {logs.map((log) => (
          <div key={log.id}>
            <strong>{log.action}</strong>
            <span>{log.actorType}</span>
            <span>{log.targetType ?? "-"}:{log.targetId ?? "-"}</span>
            <span>{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
