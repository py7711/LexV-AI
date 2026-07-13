import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import {
  createLocalAuthUser,
  localAuthCookieName,
  readLocalAuthUsersFromCookieHeader,
  serializeLocalAuthUsers,
  upsertLocalAuthUser
} from "@/lib/local-auth";
import { markDatabaseUnavailable, warnDatabaseFallback } from "@/lib/database-fallback";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email and a password with at least 8 characters." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          locale: parsed.data.locale ?? existing.locale
        }
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          passwordHash,
          locale: parsed.data.locale ?? "en",
          role: "USER"
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message = error instanceof Error ? error.message : "";
    const canUseLocalFallback = code === "P2022" || /timed out|connect|connection|database|unavailable|can't reach/i.test(message);
    if (canUseLocalFallback) {
      markDatabaseUnavailable(error);
      warnDatabaseFallback("Using local DeVoice registration because the database is unavailable", error);
      const localUsers = readLocalAuthUsersFromCookieHeader(request.headers.get("cookie"));
      const existingLocalUser = localUsers.find((user) => user.email === email);
      if (existingLocalUser) {
        return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
      }

      const localUser = await createLocalAuthUser({
        email,
        password: parsed.data.password,
        locale: parsed.data.locale
      });
      const response = NextResponse.json({ ok: true, local: true });
      response.cookies.set(localAuthCookieName, serializeLocalAuthUsers(upsertLocalAuthUser(localUsers, localUser)), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax"
      });
      return response;
    }
    throw error;
  }
}
