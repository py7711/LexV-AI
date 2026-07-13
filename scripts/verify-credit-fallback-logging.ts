import assert from "node:assert/strict";
import { warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { warnAboutCreditLedgerFallback } from "@/lib/credits";

async function main() {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const slowLedger = new Promise<never>(() => undefined);

    try {
      await withDatabaseTimeout(slowLedger, {
        message: "Credit ledger lookup timed out.",
        timeoutMs: 1
      });
    } catch (error) {
      warnAboutCreditLedgerFallback(error);
    }
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 1);
  assert.equal(
    warnings[0].some((arg) => arg instanceof Error),
    false,
    "credit fallback logging should not pass Error objects to console.warn"
  );
  assert.equal(String(warnings[0][0]).includes("Credit ledger lookup timed out."), true);

  warnings.length = 0;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    warnDatabaseFallback("Falling back to local DeVoice workspace because the database is unavailable", new Error("Personal workspace lookup timed out."));
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 1);
  assert.equal(
    warnings[0].some((arg) => arg instanceof Error),
    false,
    "database fallback logging should not pass Error objects to console.warn"
  );
  assert.equal(String(warnings[0][0]).includes("Personal workspace lookup timed out."), true);

  console.log("credit fallback logging ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
