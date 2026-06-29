import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreditState } from "@/lib/credits";
import { addLocalCreditsToState, localCreditCookieName, parseLocalCreditLedger } from "@/lib/local-credits";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to view credits." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const localLedger = parseLocalCreditLedger(cookieStore.get(localCreditCookieName)?.value);
  const credits = addLocalCreditsToState(await getCreditState(session.user.id), localLedger);

  return NextResponse.json({ credits });
}
