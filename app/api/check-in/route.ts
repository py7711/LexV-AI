import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dailyCheckInCredits, getCreditState, getDefaultCreditState } from "@/lib/credits";
import { warnDatabaseFallback } from "@/lib/database-fallback";
import { addLocalCreditsToState, claimLocalDailyCredits, localCreditCookieName, readLocalCreditLedgerFromCookieHeader, serializeLocalCreditLedger } from "@/lib/local-credits";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function localCheckInResponse(request: Request) {
  const currentLedger = readLocalCreditLedgerFromCookieHeader(request.headers.get("cookie"));
  const result = claimLocalDailyCredits(currentLedger, dailyCheckInCredits);
  const credits = addLocalCreditsToState(getDefaultCreditState({ freeCredits: 0, totalEarnedCredits: 0, remainingCredits: 0 }), result.ledger);
  const response = NextResponse.json({
    credits,
    claimed: result.claimed
  });
  response.cookies.set(localCreditCookieName, serializeLocalCreditLedger(result.ledger), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });
  return response;
}

function mirrorClaimedDate(response: NextResponse, request: Request) {
  const currentLedger = readLocalCreditLedgerFromCookieHeader(request.headers.get("cookie"));
  const result = claimLocalDailyCredits(currentLedger, 0);
  response.cookies.set(localCreditCookieName, serializeLocalCreditLedger(result.ledger), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });
  return response;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to claim free credits." }, { status: 401 });
  }

  try {
    const existingClaim = await prisma.auditLog.findFirst({
      where: {
        actorUserId: session.user.id,
        action: "credits.daily_check_in.claimed",
        createdAt: {
          gte: startOfToday()
        }
      }
    });

    if (!existingClaim) {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "user",
          action: "credits.daily_check_in.claimed",
          targetType: "CreditLedger",
          metadata: {
            amount: dailyCheckInCredits
          },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined
        }
      });
    }

    const credits = await getCreditState(session.user.id);
    return mirrorClaimedDate(NextResponse.json({
      credits: {
        ...credits,
        todayClaimed: true,
        lastClaimedAt: credits.lastClaimedAt ?? new Date().toISOString()
      },
      claimed: !existingClaim
    }), request);
  } catch (error) {
    warnDatabaseFallback("Credit check-in ledger is unavailable; returning demo credit state", error);
    return localCheckInResponse(request);
  }
}
