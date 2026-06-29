import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { verifyStripeSignature } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

type StripeMetadata = {
  userId?: string;
  workspaceId?: string;
  plan?: string;
  kind?: string;
  label?: string;
  credits?: string;
  amountUsd?: string;
};

type StripeObject = {
  id?: string;
  amount_paid?: number;
  billing_reason?: string;
  customer?: string;
  currency?: string;
  metadata?: StripeMetadata;
  subscription?: string;
  subscription_details?: {
    metadata?: StripeMetadata;
  };
  status?: string;
};

type StripeEvent = {
  type?: string;
  data?: {
    object?: StripeObject;
  };
};

function stripeMetadata(object?: StripeObject) {
  return object?.metadata?.workspaceId ? object.metadata : object?.subscription_details?.metadata;
}

async function hasProcessedStripePurchase(workspaceId: string, key: "sessionId" | "invoiceId", value?: string) {
  if (!value) return false;

  const purchases = await prisma.auditLog.findMany({
    where: {
      workspaceId,
      action: "credits.purchase.completed"
    },
    select: {
      metadata: true
    },
    take: 100,
    orderBy: {
      createdAt: "desc"
    }
  });

  return purchases.some((purchase) => {
    const metadata = purchase.metadata;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
    return (metadata as Record<string, unknown>)[key] === value;
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    await verifyStripeSignature({
      rawBody,
      signatureHeader: request.headers.get("stripe-signature")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe webhook 签名无效。" },
      { status: 401 }
    );
  }

  const event = JSON.parse(rawBody) as StripeEvent | null;

  if (!event?.type) {
    return NextResponse.json({ error: "Stripe webhook payload 无效。" }, { status: 400 });
  }

  const object = event.data?.object;
  const metadata = stripeMetadata(object);
  const workspaceId = metadata?.workspaceId;

  if (workspaceId && event.type === "checkout.session.completed") {
    const customer = typeof object?.customer === "string" ? object.customer : undefined;
    const plan = metadata?.plan ?? "pro";
    const kind = metadata?.kind === "subscription" ? "subscription" : "credits";

    if (kind === "subscription") {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          stripeCustomerId: customer,
          subscriptionStatus: "active"
        }
      });
    } else if (customer) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          stripeCustomerId: customer
        }
      });
    }

    const credits = Number(metadata?.credits ?? 0);
    const alreadyGranted = await hasProcessedStripePurchase(workspaceId, "sessionId", object?.id);
    if (!alreadyGranted && Number.isFinite(credits) && credits > 0) {
      await writeAuditLog({
        workspaceId,
        actorUserId: metadata?.userId,
        actorType: "stripe",
        action: "credits.purchase.completed",
        targetType: "Workspace",
        targetId: workspaceId,
        request,
        metadata: {
          plan,
          label: metadata?.label,
          credits,
          amountUsd: Number(metadata?.amountUsd ?? 0),
          mode: "stripe-checkout",
          kind,
          sessionId: object?.id,
          subscription: object?.subscription,
          customer
        }
      });
    }

    await writeAuditLog({
      workspaceId,
      actorType: "stripe",
      action: "billing.checkout_completed",
      targetType: "Workspace",
      targetId: workspaceId,
      request,
      metadata: {
        plan,
        kind,
        credits: metadata?.credits,
        sessionId: object?.id,
        subscription: object?.subscription,
        customer
      }
    });
  }

  if (workspaceId && event.type === "invoice.paid" && object && object.billing_reason !== "subscription_create") {
    const credits = Number(metadata?.credits ?? 0);
    const customer = typeof object?.customer === "string" ? object.customer : undefined;
    const plan = metadata?.plan ?? "pro";
    const alreadyGranted = await hasProcessedStripePurchase(workspaceId, "invoiceId", object?.id);

    if (!alreadyGranted && Number.isFinite(credits) && credits > 0) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          stripeCustomerId: customer,
          subscriptionStatus: "active"
        }
      });
      await writeAuditLog({
        workspaceId,
        actorUserId: metadata?.userId,
        actorType: "stripe",
        action: "credits.purchase.completed",
        targetType: "Workspace",
        targetId: workspaceId,
        request,
        metadata: {
          plan,
          label: metadata?.label,
          credits,
          amountUsd: Number(metadata?.amountUsd ?? 0),
          mode: "stripe-subscription-renewal",
          kind: "subscription",
          invoiceId: object.id,
          subscription: object.subscription,
          customer,
          amountPaid: object.amount_paid,
          currency: object.currency,
          billingReason: object.billing_reason
        }
      });
    }

    await writeAuditLog({
      workspaceId,
      actorType: "stripe",
      action: "billing.invoice_paid",
      targetType: "Workspace",
      targetId: workspaceId,
      request,
      metadata: {
        plan,
        credits: metadata?.credits,
        invoiceId: object.id,
        subscription: object.subscription,
        customer,
        billingReason: object.billing_reason
      }
    });
  }

  if (workspaceId && event.type === "customer.subscription.deleted") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        subscriptionStatus: "canceled"
      }
    });
    await writeAuditLog({
      workspaceId,
      actorType: "stripe",
      action: "billing.subscription_deleted",
      targetType: "Workspace",
      targetId: workspaceId,
      request,
      metadata: {
        customer: object?.customer
      }
    });
  }

  return NextResponse.json({ received: true });
}
