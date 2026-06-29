import { Redis } from "@upstash/redis";

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

// Upstash Redis 使用 HTTP REST API，在 Vercel/边缘环境中也能稳定工作。
export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

export async function rememberRecentJob(job: { id: string; sourceType: string; createdAt: string }) {
  if (!redis) {
    return;
  }

  try {
    // Store recent DeVoice jobs for lightweight history and polling.
    await redis.lpush("devoice:recent-jobs", JSON.stringify(job));
    await redis.ltrim("devoice:recent-jobs", 0, 49);
    await redis.expire("devoice:recent-jobs", 60 * 60 * 24 * 7);
  } catch (error) {
    console.warn("Unable to update recent DeVoice jobs cache; continuing the job flow.", error);
  }
}
