import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { optionalEnv, requiredEnv } from "@/lib/config";

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: requiredEnv("R2_ENDPOINT"),
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY")
      }
    });
  }

  return r2Client;
}

export function hasR2Config() {
  return Boolean(
    optionalEnv("R2_ENDPOINT") &&
      optionalEnv("R2_ACCESS_KEY_ID") &&
      optionalEnv("R2_SECRET_ACCESS_KEY") &&
      optionalEnv("R2_BUCKET")
  );
}

export async function createUploadUrl(input: {
  fileName: string;
  contentType: string;
  workspaceId?: string;
}) {
  if (!hasR2Config()) {
    throw new Error("Cloudflare R2 未配置，无法创建上传签名。");
  }

  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  const storageKey = `uploads/${input.workspaceId ?? "personal"}/${Date.now()}-${safeFileName}`;
  const command = new PutObjectCommand({
    Bucket: requiredEnv("R2_BUCKET"),
    Key: storageKey,
    ContentType: input.contentType
  });

  // 只签发短时上传 URL，客户端不能获得 R2 密钥。
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 * 10 });
  const publicBaseUrl = optionalEnv("R2_PUBLIC_BASE_URL");

  return {
    storageKey,
    uploadUrl,
    expiresIn: 600,
    publicUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${storageKey}` : undefined
  };
}

export async function putObject(input: {
  storageKey: string;
  contentType: string;
  body: Uint8Array;
}) {
  if (!hasR2Config()) {
    throw new Error("Cloudflare R2 未配置，无法保存生成结果。");
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: requiredEnv("R2_BUCKET"),
      Key: input.storageKey,
      ContentType: input.contentType,
      Body: input.body
    })
  );

  const publicBaseUrl = optionalEnv("R2_PUBLIC_BASE_URL");
  return {
    storageKey: input.storageKey,
    publicUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${input.storageKey}` : undefined
  };
}

export async function getObjectBytes(storageKey: string) {
  if (!hasR2Config()) {
    throw new Error("Cloudflare R2 未配置，无法读取对象。");
  }

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: requiredEnv("R2_BUCKET"),
      Key: storageKey
    })
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("R2 对象为空或无法读取。");
  }

  return new Uint8Array(bytes);
}

export async function createDownloadUrl(storageKey: string, expiresIn = 60 * 30) {
  if (!hasR2Config()) {
    throw new Error("Cloudflare R2 未配置，无法创建下载签名。");
  }

  const command = new GetObjectCommand({
    Bucket: requiredEnv("R2_BUCKET"),
    Key: storageKey
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
}
