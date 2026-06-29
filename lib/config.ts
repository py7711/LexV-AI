export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

export function optionalEnv(name: string) {
  return process.env[name] || undefined;
}

export const queueName = process.env.DEVOICE_QUEUE_NAME ?? process.env.LEXV_QUEUE_NAME ?? "devoice-media-jobs";

export function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
