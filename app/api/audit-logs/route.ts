import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleWorkspaceIds } from "@/lib/workspace";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后查看审计日志。" }, { status: 401 });
  }

  const workspaceIds = await getAccessibleWorkspaceIds(session.user.id);
  const logs = await prisma.auditLog.findMany({
    where: {
      workspaceId: { in: workspaceIds }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      workspaceId: true,
      actorUserId: true,
      actorType: true,
      action: true,
      targetType: true,
      targetId: true,
      ipAddress: true,
      metadata: true,
      createdAt: true
    }
  });

  return NextResponse.json({ logs });
}
