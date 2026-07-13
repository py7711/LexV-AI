import { prisma } from "@/lib/prisma";
import { shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import type { DeVoiceJobType } from "@/types/devoice-job";

export const dailyCheckInCredits = 10;

export type CreditState = {
  paidCredits: number;
  freeCredits: number;
  usedCredits: number;
  totalEarnedCredits: number;
  remainingCredits: number;
  todayClaimed: boolean;
  todayReward: number;
  lastClaimedAt: string | null;
};

export function getDefaultCreditState(overrides: Partial<CreditState> = {}): CreditState {
  return {
    paidCredits: 0,
    freeCredits: dailyCheckInCredits,
    usedCredits: 0,
    totalEarnedCredits: dailyCheckInCredits,
    remainingCredits: dailyCheckInCredits,
    todayClaimed: false,
    todayReward: dailyCheckInCredits,
    lastClaimedAt: null,
    ...overrides
  };
}

const creditLedgerTimeoutMs = 1200;
const creditWriteTimeoutMs = 1200;

export function warnAboutCreditLedgerFallback(error: unknown) {
  warnDatabaseFallback("Falling back to demo credit state because the credit ledger is unavailable", error);
}

function warnAboutCreditUsageWriteFallback(error: unknown) {
  warnDatabaseFallback("Unable to record credit usage; continuing the DeVoice job flow", error);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Credits 没有单独余额表，而是从审计日志和用量流水实时汇总。
// 这样购买、签到和消费都可追溯，代价是读取时需要聚合多张表。
async function readCreditStateFromLedger(userId: string): Promise<CreditState> {
  const workspaceIds = await prisma.membership.findMany({
    where: { userId },
    select: { workspaceId: true }
  });
  const accessibleWorkspaceIds = workspaceIds.map((item) => item.workspaceId);

  const [claims, todayClaim, purchases, usage] = await Promise.all([
    prisma.auditLog.count({
      where: {
        actorUserId: userId,
        action: "credits.daily_check_in.claimed"
      }
    }),
    prisma.auditLog.findFirst({
      where: {
        actorUserId: userId,
        action: "credits.daily_check_in.claimed",
        createdAt: {
          gte: startOfToday()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.auditLog.findMany({
      where: {
        actorUserId: userId,
        action: "credits.purchase.completed"
      },
      select: {
        metadata: true
      }
    }),
    accessibleWorkspaceIds.length
      ? prisma.usageEvent.aggregate({
          where: {
            workspaceId: { in: accessibleWorkspaceIds },
            unit: "credit"
          },
          _sum: {
            quantity: true
          }
        })
      : Promise.resolve({ _sum: { quantity: 0 } })
  ]);

  const paidCredits = purchases.reduce((total, purchase) => {
    const metadata = purchase.metadata;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return total;
    const credits = Number((metadata as Record<string, unknown>).credits ?? 0);
    return Number.isFinite(credits) ? total + credits : total;
  }, 0);

  const earnedFreeCredits = claims * dailyCheckInCredits;
  const usedCredits = usage._sum.quantity ?? 0;
  const freeCredits = Math.max(0, earnedFreeCredits - usedCredits);

  return {
    paidCredits,
    freeCredits,
    usedCredits,
    totalEarnedCredits: earnedFreeCredits + paidCredits,
    remainingCredits: Math.max(0, earnedFreeCredits + paidCredits - usedCredits),
    todayClaimed: Boolean(todayClaim),
    todayReward: dailyCheckInCredits,
    lastClaimedAt: todayClaim?.createdAt.toISOString() ?? null
  };
}

export async function getCreditState(userId: string): Promise<CreditState> {
  if (shouldUseDatabaseFallback()) {
    return getDefaultCreditState();
  }

  const ledgerState = readCreditStateFromLedger(userId);

  try {
    return await withDatabaseTimeout(ledgerState, {
      message: "Credit ledger lookup timed out.",
      timeoutMs: creditLedgerTimeoutMs
    });
  } catch (error) {
    warnAboutCreditLedgerFallback(error);
    return getDefaultCreditState();
  }
}

export function estimateCreditCost(sourceType: DeVoiceJobType | string, durationSec?: number | null) {
  // 创建任务时先按 60 秒预扣；Worker 拿到真实时长后会补记差额 credits。
  const durationMinutes = Math.max(1, Math.ceil((durationSec ?? 60) / 60));
  if (sourceType === "remove_noise") return Math.max(1, Math.ceil((durationSec ?? 60) / 10));
  if (sourceType === "voice_enhance") return Math.max(1, Math.ceil((durationSec ?? 60) / 10));
  if (sourceType === "voice_change") return Math.max(1, Math.ceil((durationSec ?? 60) / 10));
  if (sourceType === "audio_extract") return Math.max(1, durationMinutes);
  if (sourceType === "ai_dubbing") return 2;
  if (sourceType === "ai_music") return 3;
  if (sourceType === "ai_rap") return 3;
  if (sourceType === "rap_lyrics") return 1;
  if (sourceType === "text_to_speech") return 1;
  if (sourceType === "voice_clone") return 5;
  if (sourceType === "youtube_summary") return Math.max(2, durationMinutes);
  return durationMinutes;
}

export async function getRemainingCredits(userId: string) {
  const credits = await getCreditState(userId);
  return credits.remainingCredits;
}

export async function recordCreditUsage(input: {
  workspaceId: string;
  mediaJobId?: string;
  sourceType: string;
  quantity: number;
  provider?: string | null;
}) {
  if (shouldUseDatabaseFallback()) {
    return null;
  }

  // 这里故意失败吞掉：媒体任务结果比积分流水写入更关键，失败会在日志中暴露。
  const usageWrite = prisma.usageEvent.create({
    data: {
      workspaceId: input.workspaceId,
      mediaJobId: input.mediaJobId,
      eventType: "credits.consumed",
      quantity: Math.max(1, input.quantity),
      unit: "credit",
      provider: input.provider ?? "DeVoice"
    }
  });

  try {
    return await withDatabaseTimeout(usageWrite, {
      message: "Credit usage write timed out.",
      timeoutMs: creditWriteTimeoutMs
    });
  } catch (error) {
    warnAboutCreditUsageWriteFallback(error);
    return null;
  }
}
