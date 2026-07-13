import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const cssPath = path.join(repoRoot, "app/globals.css");
const outputPath = path.join(repoRoot, "docs/research/devoice.io/noise-mobile-css-audit-20260701.json");

const css = fs.readFileSync(cssPath, "utf8");

function findMediaBlocks(source, query) {
  const blocks = [];
  let searchStart = 0;

  while (searchStart < source.length) {
    const mediaStart = source.indexOf(`@media ${query}`, searchStart);
    if (mediaStart === -1) break;
    const firstBrace = source.indexOf("{", mediaStart);
    if (firstBrace === -1) break;

    let depth = 0;
    for (let index = firstBrace; index < source.length; index += 1) {
      const char = source[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(source.slice(firstBrace + 1, index));
        searchStart = index + 1;
        break;
      }
    }
  }

  return blocks;
}

function findRule(block, selector) {
  const selectorIndex = block.indexOf(selector);
  if (selectorIndex === -1) return null;
  const firstBrace = block.indexOf("{", selectorIndex);
  if (firstBrace === -1) return null;

  let depth = 0;
  for (let index = firstBrace; index < block.length; index += 1) {
    const char = block[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return block.slice(firstBrace + 1, index).trim();
  }

  return null;
}

function declarations(ruleBody) {
  if (!ruleBody) return {};
  return Object.fromEntries(
    ruleBody
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const colonIndex = item.indexOf(":");
        if (colonIndex === -1) return null;
        return [item.slice(0, colonIndex).trim(), item.slice(colonIndex + 1).trim()];
      })
      .filter(Boolean)
  );
}

function checkRule(block, selector, expectedDeclarations) {
  const body = findRule(block, selector);
  const foundDeclarations = declarations(body);
  const mismatchedDeclarations = Object.entries(expectedDeclarations)
    .filter(([property, value]) => foundDeclarations[property] !== value)
    .map(([property, value]) => ({ property, expected: value, actual: foundDeclarations[property] ?? null }));

  return {
    ok: Boolean(body) && mismatchedDeclarations.length === 0,
    selector,
    declarations: foundDeclarations,
    missing: !body,
    mismatchedDeclarations
  };
}

const mediaQuery = "(max-width: 700px)";
const blocks = findMediaBlocks(css, mediaQuery);
const block = blocks.join("\n");
const checks = block
  ? [
      {
        name: "noise upload frame matches 390px viewport width",
        ...checkRule(block, ".noiseFrame", {
          width: "min(100%, 352px)",
          padding: "12px"
        })
      },
      {
        name: "noise progress steps remain four columns on mobile",
        ...checkRule(block, ".noiseSteps", {
          "grid-template-columns": "repeat(4, minmax(0, 1fr))",
          "margin-top": "12px"
        })
      },
      {
        name: "noise step labels stack inside each column",
        ...checkRule(block, ".noiseSteps span", {
          "flex-direction": "column",
          "text-align": "center"
        })
      },
      {
        name: "noise dropzone keeps stable mobile height",
        ...checkRule(block, ".noiseDrop", {
          "min-height": "318px",
          padding: "20px 16px"
        })
      }
    ]
  : [];

const failed = checks.filter((check) => !check.ok);
const report = {
  generatedAt: new Date().toISOString(),
  cssPath: "app/globals.css",
  mediaQuery,
  purpose:
    "Static guard for remove-background-noise and ai-noise-filter mobile upload panel geometry while screenshot captures can include stale or polluted states.",
  mediaBlockCount: blocks.length,
  mediaBlockFound: blocks.length > 0,
  ok: blocks.length > 0 && failed.length === 0,
  failed,
  checks,
  notes: [
    "This audit verifies the mobile CSS contract for the noise upload panel. It does not prove visual parity by itself.",
    "The target ai-noise-filter mobile screenshot currently includes a top promo banner, so screenshot quality classification must be checked before using that pair for UI tuning."
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(`noise mobile CSS audit: ${report.ok ? "PASS" : "FAIL"}`);

if (!report.ok) {
  process.exitCode = 1;
}
