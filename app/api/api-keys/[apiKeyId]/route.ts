import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ apiKeyId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后撤销 API Key。" }, { status: 401 });
  }

  const { apiKeyId } = await context.params;
  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      workspaceId: { in: workspaceIds }
    }
  });

  if (!apiKey) {
    return NextResponse.json({ error: "API Key 不存在或无权操作。" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id: apiKey.id } });
  await writeAuditLog({
    workspaceId: apiKey.workspaceId,
    actorUserId: session.user.id,
    action: "api_key.revoked",
    targetType: "ApiKey",
    targetId: apiKey.id,
    request,
    metadata: {
      name: apiKey.name
    }
  });
  return NextResponse.json({ revoked: true });
}
