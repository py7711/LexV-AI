import { prisma } from "@/lib/prisma";
import { billingPlanConfigs } from "@/lib/billing";

type HealthItem = {
  key: string;
  label: string;
  ok: boolean;
  required: string[];
  missing: string[];
  note?: string;
};

function envGroup(key: string, label: string, required: string[], note?: string): HealthItem {
  const missing = required.filter((name) => !process.env[name]);
  return {
    key,
    label,
    ok: missing.length === 0,
    required,
    missing,
    note
  };
}

export async function getSystemHealth() {
  const checks: HealthItem[] = [
    envGroup("site", "站点与 NextAuth", ["NEXT_PUBLIC_SITE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"]),
    envGroup("google", "Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
    envGroup("tidb", "TiDB 数据库", ["DATABASE_URL"]),
    envGroup("upstash-rest", "Upstash Redis REST", ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]),
    envGroup("bullmq", "BullMQ Redis TCP", ["REDIS_URL"], "BullMQ 需要 Upstash rediss:// TCP 连接串。"),
    envGroup("r2", "Cloudflare R2", ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]),
    envGroup("stripe", "DeVoice 支付", [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      ...Object.values(billingPlanConfigs).map((plan) => plan.env)
    ]),
    envGroup("transcription", "转写服务商", ["DEEPGRAM_API_KEY", "ASSEMBLYAI_API_KEY", "GROQ_API_KEY"]),
    envGroup("llm", "摘要模型", ["DEEPSEEK_API_KEY", "GEMINI_API_KEY"]),
    envGroup("translation", "翻译服务商", ["DEEPL_API_KEY", "DEEPSEEK_API_KEY"])
  ];

  let databaseOk = false;
  let databaseError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "数据库连接失败";
  }

  return {
    ok: checks.every((item) => item.ok) && databaseOk,
    generatedAt: new Date().toISOString(),
    database: {
      ok: databaseOk,
      error: databaseError
    },
    checks
  };
}
