import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createPlainApiKey() {
  return `devoice_${randomBytes(24).toString("base64url")}`;
}

export async function verifyApiKey(authorization: string | null) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : null;

  if (!token) {
    return null;
  }

  const keyHash = hashApiKey(token);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { workspace: true }
  });

  if (!apiKey) {
    return null;
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return apiKey;
}
