import { hashPassword, verifyPassword } from "@/lib/password";

export const localAuthCookieName = "devoice_local_auth";

export type LocalAuthUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  locale: string;
  createdAt: string;
};

const maxLocalUsers = 8;
const maxCookieLength = 3800;

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function normalizeLocalUser(value: unknown): LocalAuthUser | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LocalAuthUser>;
  if (!item.id || !item.email || !item.passwordHash || !item.createdAt) return null;

  const email = String(item.email).trim().toLowerCase();
  return {
    id: String(item.id),
    email,
    name: String(item.name ?? email.split("@")[0]),
    passwordHash: String(item.passwordHash),
    locale: String(item.locale ?? "en"),
    createdAt: String(item.createdAt)
  };
}

export function parseLocalAuthUsers(value?: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(base64UrlDecode(value)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const user = normalizeLocalUser(item);
      return user ? [user] : [];
    });
  } catch {
    return [];
  }
}

export function readLocalAuthUsersFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) return [];

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${localAuthCookieName}=`));

  if (!cookie) return [];
  return parseLocalAuthUsers(decodeURIComponent(cookie.slice(localAuthCookieName.length + 1)));
}

export function serializeLocalAuthUsers(users: LocalAuthUser[]) {
  let nextUsers = users.slice(0, maxLocalUsers);
  let serialized = base64UrlEncode(JSON.stringify(nextUsers));

  while (serialized.length > maxCookieLength && nextUsers.length > 1) {
    nextUsers = nextUsers.slice(0, -1);
    serialized = base64UrlEncode(JSON.stringify(nextUsers));
  }

  return serialized;
}

export async function createLocalAuthUser(input: { email: string; password: string; locale?: string }) {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  return {
    id: `local-${email.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    email,
    name: email.split("@")[0],
    passwordHash: await hashPassword(input.password),
    locale: input.locale ?? "en",
    createdAt: now
  } satisfies LocalAuthUser;
}

export function upsertLocalAuthUser(users: LocalAuthUser[], user: LocalAuthUser) {
  return [user, ...users.filter((item) => item.email !== user.email)].slice(0, maxLocalUsers);
}

export async function updateLocalAuthUserPassword(users: LocalAuthUser[], email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find((item) => item.email === normalizedEmail);
  if (!existing) return null;

  return upsertLocalAuthUser(users, {
    ...existing,
    passwordHash: await hashPassword(password)
  });
}

export async function verifyLocalAuthUser(users: LocalAuthUser[], email: string, password: string) {
  const user = users.find((item) => item.email === email.trim().toLowerCase());
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}
