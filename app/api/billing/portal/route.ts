import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createPortalSession } from "@/lib/billing";
import { assertOwnsWorkspace, getOrCreatePersonalSpace } from "@/lib/workspace";

const portalSchema = z.object({
  workspaceId: z.string().optional(),
  locale: z.string().default("en")
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice before managing billing." }, { status: 401 });
  }

  const parsed = portalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid billing request." }, { status: 400 });
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

  if (!workspace?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing profile is available yet. Please buy credits first." }, { status: 400 });
  }

  try {
    const portal = await createPortalSession({
      customerId: workspace.stripeCustomerId,
      locale: parsed.data.locale
    });

    return NextResponse.json({ portal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建 Stripe Portal 失败。" },
      { status: 500 }
    );
  }
}
