import { requiredEnv, siteOrigin } from "@/lib/config";

type StripeSession = {
  id: string;
  url?: string;
  customer?: string;
};

type BillingPlanKind = "credits" | "subscription";

type BillingPlanConfig = {
  env: string;
  kind: BillingPlanKind;
  credits: number;
  label: string;
  amountUsd: number;
};

export const billingPlanConfigs = {
  entry: {
    env: "STRIPE_ENTRY_PRICE_ID",
    kind: "credits",
    credits: 1200,
    label: "Entry Package",
    amountUsd: 7.99
  },
  standard: {
    env: "STRIPE_STANDARD_PRICE_ID",
    kind: "credits",
    credits: 2600,
    label: "Standard Package",
    amountUsd: 14.99
  },
  comprehensive: {
    env: "STRIPE_COMPREHENSIVE_PRICE_ID",
    kind: "credits",
    credits: 7000,
    label: "Comprehensive Package",
    amountUsd: 34.99
  },
  elite: {
    env: "STRIPE_ELITE_CREDITS_PRICE_ID",
    kind: "credits",
    credits: 15000,
    label: "Elite Package",
    amountUsd: 69.99
  },
  basic: {
    env: "STRIPE_BASIC_PRICE_ID",
    kind: "subscription",
    credits: 1000,
    label: "Basic Plan",
    amountUsd: 89.99
  },
  pro: {
    env: "STRIPE_PRO_PRICE_ID",
    kind: "subscription",
    credits: 4800,
    label: "Pro Plan",
    amountUsd: 299.99
  },
  subscription_elite: {
    env: "STRIPE_ELITE_SUBSCRIPTION_PRICE_ID",
    kind: "subscription",
    credits: 12000,
    label: "Elite Plan",
    amountUsd: 799.99
  },
  credit_package: {
    env: "STRIPE_CREDIT_PACKAGE_PRICE_ID",
    kind: "credits",
    credits: 600,
    label: "Credit Package",
    amountUsd: 4.99
  }
} satisfies Record<string, BillingPlanConfig>;

export type BillingPlan = keyof typeof billingPlanConfigs;

async function stripePost<T>(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Stripe HTTP ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export function getBillingPlanConfig(plan: string) {
  const config = billingPlanConfigs[plan as BillingPlan];
  if (!config) {
    throw new Error("This DeVoice credit package is not available for online checkout yet.");
  }
  return config;
}

export function hasStripeCheckoutConfig(plan: string) {
  const config = billingPlanConfigs[plan as BillingPlan];
  return Boolean(process.env.STRIPE_SECRET_KEY && config && process.env[config.env]);
}

export function priceIdForPlan(plan: string) {
  return requiredEnv(getBillingPlanConfig(plan).env);
}

export async function createCheckoutSession(input: {
  plan: string;
  userId: string;
  workspaceId: string;
  email?: string | null;
  locale: string;
}) {
  const origin = siteOrigin();
  const plan = getBillingPlanConfig(input.plan);
  const body = new URLSearchParams({
    mode: plan.kind === "subscription" ? "subscription" : "payment",
    success_url: `${origin}/${input.locale}/payment/result?billing=success&credits=${plan.credits}&plan=${input.plan}&kind=${plan.kind}`,
    cancel_url: `${origin}/${input.locale}/payment/result?billing=cancelled&plan=${input.plan}&kind=${plan.kind}`,
    "line_items[0][price]": priceIdForPlan(input.plan),
    "line_items[0][quantity]": "1",
    "metadata[userId]": input.userId,
    "metadata[workspaceId]": input.workspaceId,
    "metadata[plan]": input.plan,
    "metadata[kind]": plan.kind,
    "metadata[label]": plan.label,
    "metadata[credits]": String(plan.credits),
    "metadata[amountUsd]": String(plan.amountUsd)
  });

  if (plan.kind === "subscription") {
    body.set("subscription_data[metadata][userId]", input.userId);
    body.set("subscription_data[metadata][workspaceId]", input.workspaceId);
    body.set("subscription_data[metadata][plan]", input.plan);
    body.set("subscription_data[metadata][kind]", plan.kind);
    body.set("subscription_data[metadata][label]", plan.label);
    body.set("subscription_data[metadata][credits]", String(plan.credits));
    body.set("subscription_data[metadata][amountUsd]", String(plan.amountUsd));
  }

  if (input.email) {
    body.set("customer_email", input.email);
  }

  return stripePost<StripeSession>("checkout/sessions", body);
}

export async function createPortalSession(input: { customerId: string; locale: string }) {
  const origin = siteOrigin();
  return stripePost<StripeSession>(
    "billing_portal/sessions",
    new URLSearchParams({
      customer: input.customerId,
      return_url: `${origin}/${input.locale}/dashboard`
    })
  );
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyStripeSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  toleranceSec?: number;
}) {
  const secret = requiredEnv("STRIPE_WEBHOOK_SECRET");
  const entries = Object.fromEntries(
    (input.signatureHeader ?? "").split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = entries.t;
  const signature = entries.v1;

  if (!timestamp || !signature) {
    throw new Error("Missing Stripe signature fields.");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const timestampSec = Number(timestamp);
  if (!Number.isFinite(timestampSec) || Math.abs(nowSec - timestampSec) > (input.toleranceSec ?? 300)) {
    throw new Error("Stripe webhook timestamp is outside the accepted tolerance.");
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${input.rawBody}`);
  if (!timingSafeEqual(expected, signature)) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}
