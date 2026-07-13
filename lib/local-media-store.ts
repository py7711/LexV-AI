import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { siteOrigin } from "@/lib/config";

const localMediaScheme = "local://";

function baseDir() {
  return path.resolve(process.cwd(), process.env.DEVOICE_LOCAL_MEDIA_DIR ?? ".devoice-local-media");
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 140) || "media";
}

function tokenFor(storageKey: string) {
  return Buffer.from(storageKey.replace(/^local:\/\//, ""), "utf8").toString("base64url");
}

export function isLocalMediaStorageKey(storageKey?: string | null) {
  return Boolean(storageKey?.startsWith(localMediaScheme));
}

export function createLocalMediaStorageKey(input: {
  workspaceId?: string | null;
  fileName: string;
  mediaKind?: string;
}) {
  const workspace = safeSegment(input.workspaceId ?? "personal");
  const kind = safeSegment(input.mediaKind ?? "source");
  const fileName = safeSegment(input.fileName);
  const entropy = randomBytes(8).toString("hex");
  return `${localMediaScheme}${kind}/${workspace}/${Date.now()}-${entropy}-${fileName}`;
}

export function localMediaPath(storageKey: string) {
  if (!isLocalMediaStorageKey(storageKey)) {
    throw new Error("Storage key is not a local DeVoice media key.");
  }

  const relative = storageKey.slice(localMediaScheme.length);
  const parts = relative.split("/").filter(Boolean).map(safeSegment);
  if (!parts.length) {
    throw new Error("Local media storage key is empty.");
  }

  return path.join(baseDir(), ...parts);
}

export async function putLocalMediaObject(input: {
  storageKey: string;
  body: Uint8Array;
}) {
  const filePath = localMediaPath(input.storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, input.body);
  return {
    storageKey: input.storageKey,
    byteSize: input.body.byteLength,
    etag: createHash("sha256").update(input.body).digest("hex")
  };
}

export async function getLocalMediaObject(input: {
  storageKey: string;
}) {
  const filePath = localMediaPath(input.storageKey);
  const [bytes, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);
  return {
    body: new Uint8Array(bytes),
    byteSize: metadata.size,
    updatedAt: metadata.mtime
  };
}

export function createLocalMediaUploadUrl(storageKey: string) {
  return `${siteOrigin().replace(/\/$/, "")}/api/local-media/${tokenFor(storageKey)}`;
}

export function createLocalMediaDownloadUrl(storageKey: string) {
  return createLocalMediaUploadUrl(storageKey);
}

export function parseLocalMediaToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    if (!decoded || decoded.includes("..")) return null;
    return `${localMediaScheme}${decoded}`;
  } catch {
    return null;
  }
}
