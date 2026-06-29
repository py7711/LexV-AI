import { createHash, randomBytes } from "crypto";
import { siteOrigin } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const resetPrefix = "password-reset:";
const defaultResetTtlMinutes = 30;

function resetTtlMinutes() {
  const value = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? defaultResetTtlMinutes);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 24 * 60) : defaultResetTtlMinutes;
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetIdentifier(email: string) {
  return `${resetPrefix}${email.trim().toLowerCase()}`;
}

export function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function passwordResetUrl(input: { email: string; token: string; locale?: string }) {
  const locale = input.locale || "en";
  const url = new URL(`/${locale}/reset-password`, siteOrigin());
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);
  return url.toString();
}

export async function createPasswordResetRecord(input: { email: string; locale?: string }) {
  const email = input.email.trim().toLowerCase();
  const token = createPasswordResetToken();
  const identifier = passwordResetIdentifier(email);
  const expires = new Date(Date.now() + resetTtlMinutes() * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier
    }
  });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashPasswordResetToken(token),
      expires
    }
  });

  return {
    email,
    expires,
    token,
    url: passwordResetUrl({ email, token, locale: input.locale })
  };
}

export async function consumePasswordResetToken(input: { email: string; token: string }) {
  const identifier = passwordResetIdentifier(input.email);
  const hashedToken = hashPasswordResetToken(input.token);
  const resetToken = await prisma.verificationToken.findUnique({
    where: {
      token: hashedToken
    }
  });

  if (!resetToken || resetToken.identifier !== identifier || resetToken.expires <= new Date()) {
    return false;
  }

  await prisma.verificationToken.delete({
    where: {
      token: hashedToken
    }
  });
  return true;
}
