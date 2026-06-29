export type ProviderAttempt<T> = {
  name: string;
  run: () => Promise<T>;
};

export type ProviderFallbackResult<T> = {
  provider: string;
  data: T;
  trail: Array<{
    provider: string;
    status: "success" | "failed";
    message?: string;
  }>;
};

export async function runWithFallback<T>(attempts: ProviderAttempt<T>[]): Promise<ProviderFallbackResult<T>> {
  const trail: ProviderFallbackResult<T>["trail"] = [];

  for (const attempt of attempts) {
    try {
      // 第一个成功的服务商即作为最终结果，同时保留前面失败记录用于审计和排障。
      const data = await attempt.run();
      trail.push({ provider: attempt.name, status: "success" });
      return { provider: attempt.name, data, trail };
    } catch (error) {
      trail.push({
        provider: attempt.name,
        status: "failed",
        message: error instanceof Error ? error.message : "未知错误"
      });
    }
  }

  throw new Error(`所有服务商均调用失败：${trail.map((item) => item.provider).join(" -> ")}`);
}
