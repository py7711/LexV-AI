import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const feedbackSchema = z.object({
  problem: z.string().min(1).max(120),
  severity: z.string().min(1).max(120),
  note: z.string().max(2000).optional(),
  email: z.string().email().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the feedback form." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  await writeAuditLog({
    actorUserId: session?.user?.id,
    actorType: session?.user?.id ? "user" : "system",
    action: "feedback.submitted",
    targetType: "Feedback",
    request,
    metadata: parsed.data
  });

  return NextResponse.json({ ok: true });
}
