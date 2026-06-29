import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSystemHealth } from "@/lib/health";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后查看系统状态。" }, { status: 401 });
  }

  const health = await getSystemHealth();
  return NextResponse.json({ health });
}
