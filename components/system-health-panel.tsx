"use client";

import { useState } from "react";
import { CheckCircle2, HeartPulse, XCircle } from "lucide-react";

type HealthCheck = {
  key: string;
  label: string;
  ok: boolean;
  missing: string[];
  note?: string;
};

type HealthPayload = {
  ok: boolean;
  generatedAt: string;
  database: {
    ok: boolean;
    error?: string;
  };
  checks: HealthCheck[];
};

export function SystemHealthPanel({ locale }: { locale: string }) {
  const isZh = locale.startsWith("zh");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [message, setMessage] = useState("");

  async function loadHealth() {
    const response = await fetch("/api/system/health");
    const data = (await response.json()) as { health?: HealthPayload; error?: string };
    if (!response.ok || !data.health) {
      setMessage(data.error ?? "系统状态检查失败。");
      return;
    }
    setHealth(data.health);
    setMessage("");
  }

  return (
    <div className="opsPanel healthPanel">
      <h2>
        <HeartPulse size={20} aria-hidden="true" />
        {isZh ? "开发者诊断" : "Developer diagnostics"}
      </h2>
      <button className="btn" type="button" onClick={loadHealth}>
        {isZh ? "检查配置" : "Check configuration"}
      </button>
      {message ? <p className="formMessage">{message}</p> : null}
      {health ? (
        <div className="healthList">
          <div className={health.database.ok ? "healthOk" : "healthBad"}>
            {health.database.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <strong>Database connection</strong>
            <span>{health.database.ok ? "OK" : health.database.error}</span>
          </div>
          {health.checks.map((item) => (
            <div className={item.ok ? "healthOk" : "healthBad"} key={item.key}>
              {item.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <strong>{item.label}</strong>
              <span>{item.ok ? "OK" : `${isZh ? "缺少" : "Missing"}: ${item.missing.join(", ")}`}</span>
              {item.note ? <small>{item.note}</small> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
