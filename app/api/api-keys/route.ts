import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createPlainApiKey, hashApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/prisma";
import { assertOwnsWorkspace, getOrCreatePersonalSpace, getAccessibleWorkspaceIds } from "@/lib/workspace";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(80),
  workspaceId: z.string().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后查看 API Key。" }, { status: 401 });
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      lastUsedAt: true,
      createdAt: true
    }
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后创建 API Key。" }, { status: 401 });
  }

  const parsed = createApiKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "API Key 参数无效。" }, { status: 400 });
  }

  const workspace = parsed.data.workspaceId
    ? await assertOwnsWorkspace({
        userId: session.user.id,
        workspaceId: parsed.data.workspaceId
      })
    : await getOrCreatePersonalSpace({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      });

  if (!workspace) {
    return NextResponse.json({ error: "Unable to resolve your DeVoice account." }, { status: 400 });
  }

  const plainKey = createPlainApiKey();
  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      keyHash: hashApiKey(plainKey)
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdAt: true
    }
  });

  await writeAuditLog({
    workspaceId: workspace.id,
    actorUserId: session.user.id,
    action: "api_key.created",
    targetType: "ApiKey",
    targetId: apiKey.id,
    request,
    metadata: {
      name: apiKey.name
    }
  });

  return NextResponse.json({ apiKey, plainKey });
}
