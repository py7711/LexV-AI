import type { CreditState } from "@/lib/credits";

export const localCreditCookieName = "devoice_local_credits";

const maxLocalCredits = 1_000_000;

export type LocalCreditLedger = {
  paidCredits: number;
  freeCredits: number;
  dailyClaimDates: string[];
  lastClaimedAt: string | null;
};

function clampCredits(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maxLocalCredits, Math.floor(value)));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeLedger(value: Partial<LocalCreditLedger> = {}): LocalCreditLedger {
  const dailyClaimDates = Array.isArray(value.dailyClaimDates)
    ? [...new Set(value.dailyClaimDates.map((item) => String(item)).filter(Boolean))].slice(-60)
    : [];

  return {
    paidCredits: clampCredits(Number(value.paidCredits ?? 0)),
    freeCredits: clampCredits(Number(value.freeCredits ?? 0)),
    dailyClaimDates,
    lastClaimedAt: value.lastClaimedAt ? String(value.lastClaimedAt) : null
  };
}

export function parseLocalCreditValue(value?: string | null) {
  return parseLocalCreditLedger(value).paidCredits;
}

export function parseLocalCreditLedger(value?: string | null): LocalCreditLedger {
  if (!value) return normalizeLedger();

  const decoded = decodeURIComponent(value);
  const legacyCredits = Number(decoded);
  if (Number.isFinite(legacyCredits)) {
    return normalizeLedger({ paidCredits: legacyCredits });
  }

  try {
    const parsed = JSON.parse(Buffer.from(decoded, "base64url").toString("utf8")) as Partial<LocalCreditLedger>;
    return normalizeLedger(parsed);
  } catch {
    return normalizeLedger();
  }
}

export function readLocalCreditsFromCookieHeader(cookieHeader?: string | null) {
  return readLocalCreditLedgerFromCookieHeader(cookieHeader).paidCredits;
}

export function readLocalCreditLedgerFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) return normalizeLedger();

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${localCreditCookieName}=`));

  if (!cookie) return normalizeLedger();

  return parseLocalCreditLedger(cookie.slice(localCreditCookieName.length + 1));
}

export function serializeLocalCreditValue(value: number) {
  return serializeLocalCreditLedger({ paidCredits: value, freeCredits: 0, dailyClaimDates: [], lastClaimedAt: null });
}

export function serializeLocalCreditLedger(value: Partial<LocalCreditLedger>) {
  return Buffer.from(JSON.stringify(normalizeLedger(value)), "utf8").toString("base64url");
}

export function addPaidLocalCredits(ledger: LocalCreditLedger, credits: number) {
  return normalizeLedger({
    ...ledger,
    paidCredits: ledger.paidCredits + clampCredits(credits)
  });
}

export function claimLocalDailyCredits(ledger: LocalCreditLedger, amount: number) {
  const today = todayKey();
  if (ledger.dailyClaimDates.includes(today)) {
    return { ledger, claimed: false };
  }

  const claimedAt = new Date().toISOString();
  return {
    ledger: normalizeLedger({
      ...ledger,
      freeCredits: ledger.freeCredits + clampCredits(amount),
      dailyClaimDates: [...ledger.dailyClaimDates, today],
      lastClaimedAt: claimedAt
    }),
    claimed: true
  };
}

export function addLocalCreditsToState(state: CreditState, localCredits: number | LocalCreditLedger): CreditState {
  const ledger = typeof localCredits === "number" ? normalizeLedger({ paidCredits: localCredits }) : normalizeLedger(localCredits);
  if (!ledger.paidCredits && !ledger.freeCredits && !ledger.dailyClaimDates.length) return state;
  const today = todayKey();

  return {
    ...state,
    paidCredits: state.paidCredits + ledger.paidCredits,
    freeCredits: state.freeCredits + ledger.freeCredits,
    totalEarnedCredits: state.totalEarnedCredits + ledger.paidCredits + ledger.freeCredits,
    remainingCredits: state.remainingCredits + ledger.paidCredits + ledger.freeCredits,
    todayClaimed: state.todayClaimed || ledger.dailyClaimDates.includes(today),
    lastClaimedAt: state.lastClaimedAt ?? ledger.lastClaimedAt
  };
}
