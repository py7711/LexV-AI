import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, getBillingPlanConfig, hasStripeCheckoutConfig } from "@/lib/billing";
import { writeAuditLog } from "@/lib/audit";
import { isLocale, localizedPath, type Locale } from "@/lib/i18n";
import {
  addPaidLocalCredits,
  localCreditCookieName,
  readLocalCreditLedgerFromCookieHeader,
  serializeLocalCreditLedger
} from "@/lib/local-credits";
import { assertOwnsWorkspace, getOrCreatePersonalSpace } from "@/lib/workspace";

const checkoutSchema = z.object({
  plan: z.enum(["entry", "standard", "comprehensive", "elite", "basic", "pro", "subscription_elite", "credit_package"]),
  workspaceId: z.string().optional(),
  locale: z.string().default("en")
});

function localWorkspaceId(userId: string) {
  return `local-${Buffer.from(userId).toString("base64url").slice(0, 16)}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice before buying credits." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credit package request." }, { status: 400 });
  }

  try {
    if (!hasStripeCheckoutConfig(parsed.data.plan)) {
      const creditPackage = getBillingPlanConfig(parsed.data.plan);
      const locale: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : "en";
      const localCreditLedger = addPaidLocalCredits(readLocalCreditLedgerFromCookieHeader(request.headers.get("cookie")), creditPackage.credits);
      const workspaceId = parsed.data.workspaceId ?? localWorkspaceId(session.user.id);
      void writeAuditLog({
        workspaceId,
        actorUserId: session.user.id,
        action: "credits.purchase.completed",
        targetType: "Workspace",
        targetId: workspaceId,
        request,
        metadata: {
          plan: parsed.data.plan,
          label: creditPackage.label,
          credits: creditPackage.credits,
          amountUsd: creditPackage.amountUsd,
          kind: creditPackage.kind,
          mode: "local-checkout"
        }
      });

      const response = NextResponse.json({
        checkout: {
          id: `local-${workspaceId}-${Date.now()}`,
          url: `${localizedPath(locale, "payment/result")}?billing=success&credits=${creditPackage.credits}&plan=${parsed.data.plan}`,
          local: true,
          credits: creditPackage.credits,
          localCreditBalance: localCreditLedger.paidCredits + localCreditLedger.freeCredits
        }
      });
      response.cookies.set(localCreditCookieName, serializeLocalCreditLedger(localCreditLedger), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax"
      });
      return response;
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

    const checkout = await createCheckoutSession({
      plan: parsed.data.plan,
      userId: session.user.id,
      workspaceId: workspace.id,
      email: session.user.email,
      locale: parsed.data.locale
    });

    return NextResponse.json({ checkout });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout." },
      { status: 500 }
    );
  }
}
