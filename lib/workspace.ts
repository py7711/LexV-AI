import { prisma } from "@/lib/prisma";
import { isLocalDeVoiceUser, shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";

const workspaceLookupTimeoutMs = 1500;

type DeVoiceWorkspace = Awaited<ReturnType<typeof prisma.workspace.create>>;

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "personal";
}

function localPersonalWorkspace(user: { id: string; email?: string | null; name?: string | null }): DeVoiceWorkspace {
  const emailPrefix = user.email?.split("@")[0] ?? user.id.slice(0, 8);
  const now = new Date();

  return {
    id: `local-${user.id}`,
    name: user.name ? `${user.name} 的 DeVoice Workspace` : "DeVoice Workspace",
    slug: `personal-${slugify(emailPrefix)}-${user.id.slice(0, 6)}`,
    plan: "free",
    billingEmail: user.email ?? null,
    monthlyQuotaMinutes: 180,
    usedMinutes: 0,
    stripeCustomerId: null,
    subscriptionStatus: "trialing",
    createdAt: now,
    updatedAt: now
  };
}

export async function getOrCreatePersonalSpace(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  if (isLocalDeVoiceUser(user.id) || shouldUseDatabaseFallback()) {
    return localPersonalWorkspace(user);
  }

  const existingLookup = prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { workspace: true }
  });

  let existing: Awaited<typeof existingLookup> | null = null;

  try {
    existing = await withDatabaseTimeout(existingLookup, {
      message: "Personal workspace lookup timed out.",
      timeoutMs: workspaceLookupTimeoutMs
    });
  } catch (error) {
    existingLookup.catch(() => undefined);
    warnDatabaseFallback("Falling back to local DeVoice workspace because the database is unavailable", error);
    return localPersonalWorkspace(user);
  }

  if (existing) {
    return existing.workspace;
  }

  const name = user.name ? `${user.name} 的 DeVoice Workspace` : "DeVoice Workspace";
  const emailPrefix = user.email?.split("@")[0] ?? user.id.slice(0, 8);
  const slug = `personal-${slugify(emailPrefix)}-${user.id.slice(0, 6)}`;

  const createWorkspace = prisma.workspace.create({
    data: {
      name,
      slug,
      plan: "free",
      billingEmail: user.email,
      monthlyQuotaMinutes: 180,
      memberships: {
        create: {
          userId: user.id,
          role: "owner"
        }
      }
    }
  });

  try {
    return await withDatabaseTimeout(createWorkspace, {
      message: "Personal workspace creation timed out.",
      timeoutMs: workspaceLookupTimeoutMs
    });
  } catch (error) {
    createWorkspace.catch(() => undefined);
    warnDatabaseFallback("Falling back to local DeVoice workspace because workspace creation is unavailable", error);
    return localPersonalWorkspace(user);
  }
}

export const getOrCreateDefaultWorkspace = getOrCreatePersonalSpace;

export async function assertPersonalSpace(input: { userId: string; workspaceId?: string }) {
  if (!input.workspaceId) {
    return null;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: input.userId,
        workspaceId: input.workspaceId
      }
    },
    include: {
      workspace: true
    }
  });

  if (!membership) {
    throw new Error("无权访问该个人空间。");
  }

  return membership.workspace;
}

export const assertWorkspaceMember = assertPersonalSpace;

export async function resolveWritableWorkspace(
  user: { id: string; email?: string | null; name?: string | null },
  workspaceId?: string
) {
  const workspace = workspaceId?.startsWith("local-")
    ? localPersonalWorkspace(user)
    : isLocalDeVoiceUser(user.id)
      ? localPersonalWorkspace(user)
    : workspaceId
      ? await assertPersonalSpace({ userId: user.id, workspaceId })
      : await getOrCreatePersonalSpace(user);

  if (!workspace) {
    throw new Error("Unable to resolve your DeVoice account.");
  }

  return workspace;
}

export async function getAccessibleWorkspaceIds(userId: string) {
  if (isLocalDeVoiceUser(userId) || shouldUseDatabaseFallback()) {
    return [];
  }

  const membershipsPromise = prisma.membership.findMany({
    where: { userId },
    select: { workspaceId: true }
  });

  try {
    const memberships = await withDatabaseTimeout(membershipsPromise, {
      message: "Workspace lookup timed out.",
      timeoutMs: workspaceLookupTimeoutMs
    });
    return memberships.map((item) => item.workspaceId);
  } catch (error) {
    warnDatabaseFallback("Falling back to user-owned resources because workspace membership lookup is unavailable", error);
    return [];
  }
}

export async function assertOwnsWorkspace(input: { userId: string; workspaceId: string }) {
  if (input.workspaceId === `local-${input.userId}`) {
    return localPersonalWorkspace({ id: input.userId });
  }

  const workspace = await assertPersonalSpace(input);

  if (!workspace) {
    throw new Error("Unable to resolve your DeVoice account.");
  }

  return workspace;
}
