"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

type BillingActionsProps = {
  locale: string;
  workspaceId?: string;
  mode: "checkout" | "portal";
  plan?: "entry" | "standard" | "comprehensive" | "elite" | "basic" | "pro" | "subscription_elite" | "credit_package";
  label: string;
};

export function BillingAction({ locale, workspaceId, mode, plan, label }: BillingActionsProps) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function startBilling() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/billing/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          locale,
          workspaceId,
          plan
        })
      });
      const data = (await response.json()) as { checkout?: { url?: string }; portal?: { url?: string }; error?: string };
      const url = data.checkout?.url ?? data.portal?.url;

      if (!response.ok || !url) {
        const error = data.error ?? "Unable to create a billing session.";
        setMessage(error);
        if (response.status === 401) {
          window.dispatchEvent(new Event("devoice:open-auth"));
        }
        return;
      }

      window.location.href = url;
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="billingAction">
      <button className="btn btnPrimary" type="button" onClick={startBilling} disabled={busy}>
        <CreditCard size={18} aria-hidden="true" />
        {busy ? "Processing..." : label}
      </button>
      {message ? <small>{message}</small> : null}
    </span>
  );
}
