import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const cssPath = path.join(repoRoot, "app/globals.css");
const outputPath = path.join(repoRoot, "docs/research/devoice.io/priority-voice-mobile-lower-section-css-audit-20260701.json");

const css = fs.readFileSync(cssPath, "utf8");

function findMediaBlock(source, query) {
  const mediaStart = source.indexOf(`@media ${query}`);
  if (mediaStart === -1) return null;
  const firstBrace = source.indexOf("{", mediaStart);
  if (firstBrace === -1) return null;

  let depth = 0;
  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(firstBrace + 1, index);
    }
  }

  return null;
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
    if (depth === 0) {
      return block.slice(firstBrace + 1, index).trim();
    }
  }

  return null;
}

function splitSelectors(selectorText) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function findRuleBySelectorSet(block, selectors) {
  const normalizedSelectors = selectors.map((selector) => selector.trim().replace(/\s+/g, " "));
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of block.matchAll(ruleRegex)) {
    const selectorText = match[1].trim();
    const ruleSelectors = splitSelectors(selectorText);
    const matches =
      ruleSelectors.length === normalizedSelectors.length &&
      normalizedSelectors.every((selector) => ruleSelectors.includes(selector));
    if (matches) {
      return {
        selectorText,
        body: match[2].trim()
      };
    }
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

function hasCombinedRule(block, selectors, expectedDeclarations) {
  const rule = findRuleBySelectorSet(block, selectors);
  if (!rule) {
    return {
      ok: false,
      selectorText: null,
      declarations: {},
      missingSelectors: selectors,
      mismatchedDeclarations: []
    };
  }

  const selectorText = rule.selectorText;
  const body = rule.body;
  const foundDeclarations = declarations(body);
  const ruleSelectors = splitSelectors(selectorText);
  const missingSelectors = selectors.filter((selector) => !ruleSelectors.includes(selector));
  const mismatchedDeclarations = Object.entries(expectedDeclarations)
    .filter(([property, value]) => foundDeclarations[property] !== value)
    .map(([property, value]) => ({ property, expected: value, actual: foundDeclarations[property] ?? null }));

  return {
    ok: missingSelectors.length === 0 && mismatchedDeclarations.length === 0,
    selectorText: selectorText.trim().replace(/\s+/g, " "),
    declarations: foundDeclarations,
    missingSelectors,
    mismatchedDeclarations
  };
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

const mediaQuery = "(max-width: 920px)";
const block = findMediaBlock(css, mediaQuery);

const checks = block
  ? [
      {
        name: "clone why wrapper collapses to one-column flow",
        ...checkRule(block, ".cloneWhyBand", {
          display: "block",
          "padding-right": "16px",
          "padding-left": "16px"
        })
      },
      {
        name: "clone lower-section width reset",
        ...hasCombinedRule(
          block,
          [
            ".cloneWhyIntro",
            "section.cloneWhyBand h2",
            ".cloneWhyBand .whyGrid",
            ".cloneTestimonialsBand .testimonialGrid",
            "section.cloneTestimonialsBand h2"
          ],
          { width: "100%" }
        )
      },
      {
        name: "clone grids collapse to one column",
        ...hasCombinedRule(
          block,
          [".cloneWhyBand .whyGrid", ".cloneTestimonialsBand .testimonialGrid"],
          { "grid-template-columns": "1fr" }
        )
      },
      {
        name: "priority FAQ heading mobile type",
        ...checkRule(block, ".priorityVoiceFaqSection h2", {
          width: "100%",
          "font-size": "30px",
          "line-height": "36px"
        })
      },
      {
        name: "priority FAQ list mobile width",
        ...checkRule(block, ".priorityVoiceFaqList", {
          width: "100%",
          "max-width": "100%"
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
    "Static guard for priority Text to Speech and AI Voice Cloning lower-section mobile CSS while browser 390px lower-section capture remains unreliable.",
  mediaBlockFound: Boolean(block),
  ok: Boolean(block) && failed.length === 0,
  failed,
  checks,
  notes: [
    "This is a CSS contract audit, not a visual proof. It proves the mobile breakpoint contains the required one-column and FAQ-width overrides.",
    "It protects against regressions where desktop FAQ 70% width or multi-column clone why/testimonial grids leak into the 390px priority pages.",
    "A true browser capture at 390x844 is still required before calling the lower sections fully proven."
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(`priority voice mobile lower-section CSS audit: ${report.ok ? "PASS" : "FAIL"}`);

if (!report.ok) {
  process.exitCode = 1;
}
