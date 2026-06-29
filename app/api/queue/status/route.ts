import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatQueueError, getMediaQueue, getMediaQueueUnavailableReason, markMediaQueueUnavailable } from "@/lib/queue";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后查看队列状态。" }, { status: 401 });
  }

  const queue = getMediaQueue();

  if (!queue) {
    return NextResponse.json({
      configured: false,
      counts: null,
      message: getMediaQueueUnavailableReason() ?? "BullMQ 队列不可用。"
    });
  }

  try {
    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
    return NextResponse.json({ configured: true, counts });
  } catch (error) {
    markMediaQueueUnavailable(error);
    return NextResponse.json({
      configured: false,
      counts: null,
      message: `BullMQ 暂时不可用：${formatQueueError(error)}`
    });
  }
}
