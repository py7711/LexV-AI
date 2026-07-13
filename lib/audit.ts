import { prisma } from "@/lib/prisma";
import { warnDatabaseFallback } from "@/lib/database-fallback";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  workspaceId?: string | null;
  actorUserId?: string | null;
  actorType?: "user" | "api_key" | "system" | "stripe";
  action: string;
  targetType?: string;
  targetId?: string;
  request?: Request;
  metadata?: Prisma.InputJsonValue;
};

const auditLogTimeoutMs = 1500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

export async function writeAuditLog(input: AuditInput) {
  const ipAddress =
    input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    input.request?.headers.get("x-real-ip") ??
    undefined;
  const userAgent = input.request?.headers.get("user-agent") ?? undefined;
  const auditWrite = prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      actorType: input.actorType ?? "user",
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ipAddress,
      userAgent,
      metadata: input.metadata
    }
  });

  try {
    await withTimeout(auditWrite, auditLogTimeoutMs, "Audit log write timed out.");
  } catch (error) {
    auditWrite.catch(() => undefined);
    warnDatabaseFallback("Unable to write audit log; continuing the DeVoice flow", error);
  }
}
