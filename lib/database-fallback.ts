const fallbackCooldownMs = 30_000;
const defaultDatabaseTimeoutMs = 1200;

// Next.js 开发模式会频繁热重载模块。把数据库熔断状态挂到 globalThis，
// 可以避免每次模块重载后立刻重新打爆一个已经不可用的数据库连接。
const globalForDatabaseFallback = globalThis as unknown as {
  devoiceDatabaseFallback?: {
    unavailableUntil: number;
    lastReason?: string;
  };
};

function state() {
  globalForDatabaseFallback.devoiceDatabaseFallback ??= {
    unavailableUntil: 0
  };
  return globalForDatabaseFallback.devoiceDatabaseFallback;
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function shouldUseDatabaseFallback() {
  return Date.now() < state().unavailableUntil;
}

export function markDatabaseUnavailable(error: unknown) {
  const current = state();
  current.unavailableUntil = Date.now() + fallbackCooldownMs;
  current.lastReason = messageOf(error);
}

export function databaseFallbackReason() {
  return state().lastReason;
}

export function isLocalDeVoiceUser(userId?: string | null) {
  return Boolean(userId?.startsWith("demo-") || userId?.startsWith("local-"));
}

// Prisma 查询在无网络或云数据库冷启动时可能长时间悬挂。这里统一加短超时，
// 超时后进入本地演示兜底，让页面保持可浏览、任务流保持可演示。
export async function withDatabaseTimeout<T>(
  promise: Promise<T>,
  options: {
    message: string;
    timeoutMs?: number;
  }
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(options.message)), options.timeoutMs ?? defaultDatabaseTimeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    markDatabaseUnavailable(error);
    promise.catch(() => undefined);
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
