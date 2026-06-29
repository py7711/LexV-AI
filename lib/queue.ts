import { Queue } from "bullmq";
import { queueName } from "@/lib/config";

type MediaQueuePayload = {
  jobId: string;
  requestedBy?: string;
};

let mediaQueue: Queue<MediaQueuePayload> | null = null;
let queueUnavailableUntil = 0;
let queueUnavailableReason = "";

// 队列失败后短暂熔断，避免每个请求都反复创建 Redis TCP 连接。
const queueCircuitBreakerMs = Number(
  process.env.DEVOICE_QUEUE_CIRCUIT_BREAKER_MS ?? process.env.LEXV_QUEUE_CIRCUIT_BREAKER_MS ?? 60_000
);
const queueCommandTimeoutMs = Number(
  process.env.DEVOICE_QUEUE_COMMAND_TIMEOUT_MS ?? process.env.LEXV_QUEUE_COMMAND_TIMEOUT_MS ?? 3_000
);
const queueConnectTimeoutMs = Number(
  process.env.DEVOICE_QUEUE_CONNECT_TIMEOUT_MS ?? process.env.LEXV_QUEUE_CONNECT_TIMEOUT_MS ?? 3_000
);

function redisUrl() {
  return process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_URL ?? process.env.KV_URL;
}

export function formatQueueError(error: unknown) {
  if (error instanceof Error) {
    const code = "code" in error ? String((error as Error & { code?: string }).code) : "";
    return code ? `${code}: ${error.message}` : error.message;
  }

  return "Redis TCP 连接不可用";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export function markMediaQueueUnavailable(error: unknown) {
  queueUnavailableUntil = Date.now() + queueCircuitBreakerMs;
  queueUnavailableReason = formatQueueError(error);

  if (mediaQueue) {
    const queue = mediaQueue;
    mediaQueue = null;
    void queue.close().catch(() => undefined);
  }
}

export function getMediaQueueUnavailableReason() {
  if (process.env.DEVOICE_DISABLE_BULLMQ === "true" || process.env.LEXV_DISABLE_BULLMQ === "true") {
    return "BullMQ is disabled, so DeVoice jobs are saved without queue processing.";
  }

  if (!redisUrl()) {
    return "Redis TCP is not configured, so DeVoice jobs are saved without queue processing.";
  }

  if (queueUnavailableUntil > Date.now()) {
    return `BullMQ is temporarily unavailable (${queueUnavailableReason}), so DeVoice jobs are saved without queue processing.`;
  }

  return null;
}

function getQueueConnection() {
  const url = redisUrl();

  if (!url) {
    return null;
  }

  // BullMQ 需要 Redis TCP 连接；Upstash 需使用带 TLS 的 rediss:// 连接串，而不是 REST URL。
  return {
    url,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: queueConnectTimeoutMs,
    retryStrategy: () => null,
    tls: url.startsWith("rediss://") ? {} : undefined
  };
}

export function getMediaQueue() {
  if (getMediaQueueUnavailableReason()) {
    return null;
  }

  const connection = getQueueConnection();

  if (!connection) {
    return null;
  }

  if (!mediaQueue) {
    // Queue 实例按进程复用，避免 API 路由每次请求都打开一个新的 Redis 连接。
    mediaQueue = new Queue<MediaQueuePayload, unknown, "process-media">(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        removeOnComplete: 500,
        removeOnFail: 1000
      }
    });
    mediaQueue.on("error", (error) => {
      markMediaQueueUnavailable(error);
    });
  }

  return mediaQueue;
}

export async function enqueueMediaJob(payload: MediaQueuePayload) {
  const unavailableReason = getMediaQueueUnavailableReason();
  if (unavailableReason) {
    return { queued: false, reason: unavailableReason };
  }

  const queue = getMediaQueue();

  if (!queue) {
    return { queued: false, reason: getMediaQueueUnavailableReason() ?? "BullMQ 队列不可用，任务仅写入 TiDB。" };
  }

  try {
    const job = await withTimeout(
      queue.add("process-media", payload, {
        jobId: payload.jobId
      }),
      queueCommandTimeoutMs,
      `BullMQ 入队超时超过 ${queueCommandTimeoutMs}ms`
    );

    return { queued: true, queueJobId: job.id };
  } catch (error) {
    // 入队失败不直接中断 Web 流程；调用方会根据 queued=false 决定是否同步生成演示结果。
    markMediaQueueUnavailable(error);
    return {
      queued: false,
      reason: `BullMQ 暂时不可用（${formatQueueError(error)}），任务已写入 TiDB。`
    };
  }
}
