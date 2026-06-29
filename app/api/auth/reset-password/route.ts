import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { markDatabaseUnavailable } from "@/lib/database-fallback";
import {
  localAuthCookieName,
  readLocalAuthUsersFromCookieHeader,
  serializeLocalAuthUsers,
  updateLocalAuthUserPassword
} from "@/lib/local-auth";
import { hashPassword } from "@/lib/password";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(12),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid reset link and a password with at least 8 characters." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const token = parsed.data.token;
  const localUsers = readLocalAuthUsersFromCookieHeader(request.headers.get("cookie"));

  if (token === `local:${encodeURIComponent(email)}`) {
    const updatedUsers = await updateLocalAuthUserPassword(localUsers, email, parsed.data.password);
    if (!updatedUsers) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    await writeAuditLog({
      actorType: "system",
      action: "auth.password_reset.completed",
      targetType: "User",
      targetId: updatedUsers.find((user) => user.email === email)?.id,
      request,
      metadata: {
        email,
        mode: "local-cookie"
      }
    });

    const response = NextResponse.json({ ok: true, local: true });
    response.cookies.set(localAuthCookieName, serializeLocalAuthUsers(updatedUsers), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax"
    });
    return response;
  }

  try {
    const tokenValid = await consumePasswordResetToken({ email, token });
    if (!tokenValid) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: {
        email
      },
      data: {
        passwordHash: await hashPassword(parsed.data.password)
      },
      select: {
        id: true
      }
    });

    await writeAuditLog({
      actorUserId: user.id,
      actorType: "user",
      action: "auth.password_reset.completed",
      targetType: "User",
      targetId: user.id,
      request,
      metadata: {
        email,
        mode: "verification-token"
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2022" || /timed out|connect|connection|database|unavailable|can't reach/i.test(message)) {
      markDatabaseUnavailable(error);
      const updatedUsers = await updateLocalAuthUserPassword(localUsers, email, parsed.data.password);
      if (updatedUsers) {
        const response = NextResponse.json({ ok: true, local: true });
        response.cookies.set(localAuthCookieName, serializeLocalAuthUsers(updatedUsers), {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
          sameSite: "lax"
        });
        return response;
      }
    }
    throw error;
  }
}
