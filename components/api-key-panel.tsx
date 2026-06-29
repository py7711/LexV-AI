"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

type ApiKeyPanelProps = {
  locale: string;
  workspaceId: string;
};

type ApiKey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string | null;
};

export function ApiKeyPanel({ locale, workspaceId }: ApiKeyPanelProps) {
  const isZh = locale.startsWith("zh");
  const [name, setName] = useState("DeVoice API Key");
  const [plainKey, setPlainKey] = useState("");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [message, setMessage] = useState("");

  async function loadKeys() {
    const response = await fetch("/api/api-keys");
    const data = (await response.json()) as { keys?: ApiKey[]; error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "API Key 加载失败。");
      return;
    }
    setKeys(data.keys ?? []);
  }

  async function createKey() {
    setMessage("");
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, workspaceId })
    });
    const data = (await response.json()) as { plainKey?: string; error?: string };
    if (!response.ok || !data.plainKey) {
      setMessage(data.error ?? "API Key 创建失败。");
      return;
    }
    setPlainKey(data.plainKey);
    await loadKeys();
  }

  async function revokeKey(apiKeyId: string) {
    const response = await fetch(`/api/api-keys/${apiKeyId}`, {
      method: "DELETE"
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setMessage(data?.error ?? "API Key 撤销失败。");
      return;
    }
    await loadKeys();
  }

  return (
    <div className="opsPanel">
      <h2>
        <KeyRound size={20} aria-hidden="true" />
        {isZh ? "开发者 API Key" : "Developer API keys"}
      </h2>
      <p className="panelHelp">
        {isZh
          ? "API Key 明文只展示一次，请立即保存。服务端只保存 SHA-256 hash。"
          : "The plain API key is shown only once. The server stores only a SHA-256 hash."}
      </p>
      <div className="apiKeyCreate">
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <button className="btn btnPrimary" type="button" onClick={createKey}>
          {isZh ? "创建 Key" : "Create key"}
        </button>
        <button className="btn" type="button" onClick={loadKeys}>
          {isZh ? "刷新列表" : "Refresh"}
        </button>
      </div>
      {plainKey ? <code className="secretBox">{plainKey}</code> : null}
      {message ? <p className="formMessage">{message}</p> : null}
      <div className="apiKeyList">
        {keys.map((key) => (
          <div key={key.id}>
            <strong>{key.name}</strong>
            <span>{new Date(key.createdAt).toLocaleString()}</span>
            <button className="textButton" type="button" onClick={() => revokeKey(key.id)}>
              {isZh ? "撤销" : "Revoke"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
