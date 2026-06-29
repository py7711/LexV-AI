import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { markDatabaseUnavailable } from "@/lib/database-fallback";
import { hasTransactionalEmailConfig, sendTransactionalEmail } from "@/lib/email";
import { readLocalAuthUsersFromCookieHeader } from "@/lib/local-auth";
import { createPasswordResetRecord, passwordResetUrl } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const localUser = readLocalAuthUsersFromCookieHeader(request.headers.get("cookie")).find((user) => user.email === email);
  let userId: string | undefined = localUser?.id;
  let previewLink: string | undefined;
  let delivery = "account-not-found";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });
    userId = user?.id ?? userId;
    if (user?.email) {
      const reset = await createPasswordResetRecord({
        email,
        locale: parsed.data.locale ?? "en"
      });
      const subject = "Reset your DeVoice password";
      const text = [
        "We received a request to reset your DeVoice password.",
        "",
        `Open this link to choose a new password: ${reset.url}`,
        "",
        "This link expires soon. If you did not request this reset, you can ignore this email."
      ].join("\n");

      try {
        const result = await sendTransactionalEmail({
          to: email,
          subject,
          text,
          html: `<p>We received a request to reset your DeVoice password.</p><p><a href="${reset.url}">Reset your password</a></p><p>This link expires soon. If you did not request this reset, you can ignore this email.</p>`
        });
        delivery = result.provider;
      } catch (emailError) {
        console.warn("Unable to send DeVoice password reset email; keeping preview reset link for diagnostics.", emailError);
        delivery = "email-failed";
        previewLink = reset.url;
      }
      if (!hasTransactionalEmailConfig() || delivery === "preview" || delivery === "smtp-unavailable") {
        previewLink = reset.url;
      }
    } else if (localUser) {
      previewLink = passwordResetUrl({
        email,
        token: `local:${encodeURIComponent(email)}`,
        locale: parsed.data.locale ?? "en"
      });
      delivery = "local-preview-link";
    }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "P2022") {
      markDatabaseUnavailable(error);
      console.warn("Continuing local DeVoice password reset request because the database is unavailable.", error);
    }
    if (localUser) {
      previewLink = passwordResetUrl({
        email,
        token: `local:${encodeURIComponent(email)}`,
        locale: parsed.data.locale ?? "en"
      });
      delivery = "local-preview-link";
    } else {
      delivery = "database-unavailable";
    }
  }

  await writeAuditLog({
    actorUserId: userId,
    actorType: userId ? "user" : "system",
    action: "auth.password_reset.requested",
    targetType: "User",
    targetId: userId,
    request,
    metadata: {
      email,
      locale: parsed.data.locale ?? "en",
      delivery,
      previewLink
    }
  });

  return NextResponse.json({
    ok: true,
    previewLink: previewLink && process.env.NODE_ENV !== "production" ? previewLink : undefined
  });
}
