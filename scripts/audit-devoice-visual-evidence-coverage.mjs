import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const routeAuditPath = "docs/research/devoice.io/route-coverage-audit-20260701-current.json";
const screenshotsDir = "docs/design-references/devoice.io";
const outputPath =
  process.argv[2] ?? "docs/research/devoice.io/visual-evidence-coverage-audit-20260701.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function slugAliases(targetPath) {
  const slug = targetPath || "home";
  const lastSegment = slug.split("/").at(-1) ?? slug;
  const aliases = new Set([slug, slug.replaceAll("/", "-")]);

  if (!targetPath) {
    aliases.add("home");
  }

  if (slug.startsWith("blog/")) {
    aliases.add(lastSegment);
  }

  if (slug === "text-to-speech") {
    aliases.add("tts");
  }

  if (slug === "ai-voice-cloning") {
    aliases.add("clone");
    aliases.add("voice-cloning");
  }

  if (slug === "my-resources") {
    aliases.add("resources");
  }

  if (slug === "payment/loading") {
    aliases.add("payment-loading");
  }

  if (slug === "payment/result") {
    aliases.add("payment-result");
    aliases.add("payment-result-success");
    aliases.add("payment-result-cancelled");
  }

  if (slug === "privacy-policy") {
    aliases.add("privacy");
  }

  if (slug === "terms-of-use") {
    aliases.add("terms");
  }

  return [...aliases].filter(Boolean);
}

function matchesAnyAlias(fileName, aliases) {
  const normalized = fileName.toLowerCase();
  return aliases.some((alias) => normalized.includes(alias.toLowerCase()));
}

function viewportKind(fileName, sizeMap) {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("desktop")) return "desktop";
  if (normalized.includes("mobile")) return "mobile";

  const size = sizeMap.get(fileName);
  if (!size) return "generic";
  if (size.width >= 1000 && size.height >= 650 && size.height <= 1000) return "desktop";
  if (size.width <= 500 && size.height >= 650) return "mobile";
  return "generic";
}

function classifyFiles(files, targetPath, sizeMap) {
  const aliases = slugAliases(targetPath);
  const exclusions = excludedSubstrings(targetPath);
  const relevant = files.filter((fileName) => matchesAnyAlias(fileName, aliases) && !matchesAnyAlias(fileName, exclusions));
  const targetScreenshots = relevant.filter((fileName) => isTargetScreenshot(fileName));
  const localScreenshots = relevant.filter((fileName) => isLocalScreenshot(fileName));
  const desktopTarget = targetScreenshots.filter((fileName) => viewportKind(fileName, sizeMap) === "desktop");
  const desktopLocal = localScreenshots.filter((fileName) => viewportKind(fileName, sizeMap) === "desktop");
  const mobileTarget = targetScreenshots.filter((fileName) => viewportKind(fileName, sizeMap) === "mobile");
  const mobileLocal = localScreenshots.filter((fileName) => viewportKind(fileName, sizeMap) === "mobile");

  const hasAnyPair = targetScreenshots.length > 0 && localScreenshots.length > 0;
  const hasDesktopPair = desktopTarget.length > 0 && desktopLocal.length > 0;
  const hasMobilePair = mobileTarget.length > 0 && mobileLocal.length > 0;

  let status = "missing";
  if (hasDesktopPair && hasMobilePair) {
    status = "desktop-and-mobile";
  } else if (hasDesktopPair) {
    status = "desktop-only";
  } else if (hasMobilePair) {
    status = "mobile-only";
  } else if (hasAnyPair) {
    status = "unqualified-pair";
  } else if (targetScreenshots.length || localScreenshots.length) {
    status = "partial";
  }

  return {
    targetPath,
    aliases,
    status,
    hasAnyPair,
    hasDesktopPair,
    hasMobilePair,
    counts: {
      targetScreenshots: targetScreenshots.length,
      localScreenshots: localScreenshots.length,
      desktopTarget: desktopTarget.length,
      desktopLocal: desktopLocal.length,
      mobileTarget: mobileTarget.length,
      mobileLocal: mobileLocal.length
    },
    files: {
      target: targetScreenshots,
      local: localScreenshots,
      desktopTarget,
      desktopLocal,
      mobileTarget,
      mobileLocal,
      inferredDesktopTarget: desktopTarget.filter((fileName) => !fileName.toLowerCase().includes("desktop")),
      inferredDesktopLocal: desktopLocal.filter((fileName) => !fileName.toLowerCase().includes("desktop")),
      inferredMobileTarget: mobileTarget.filter((fileName) => !fileName.toLowerCase().includes("mobile")),
      inferredMobileLocal: mobileLocal.filter((fileName) => !fileName.toLowerCase().includes("mobile"))
    },
    sampleFiles: {
      target: targetScreenshots.slice(0, 8),
      local: localScreenshots.slice(0, 8)
    }
  };
}

async function imageSize(fileName) {
  try {
    const metadata = await sharp(path.join(repoRoot, screenshotsDir, fileName)).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

function excludedSubstrings(targetPath) {
  if (targetPath === "text-to-speech") {
    return ["demo-text-to-speech"];
  }

  return [];
}

function isLocalScreenshot(fileName) {
  const normalized = fileName.toLowerCase();
  return normalized.includes("local") && !normalized.startsWith("target-") && !normalized.startsWith("trusted-target-") && !normalized.startsWith("current-target-");
}

function isTargetScreenshot(fileName) {
  const normalized = fileName.toLowerCase();
  return normalized.includes("target") && !isLocalScreenshot(fileName);
}

const routeAudit = readJson(routeAuditPath);
const targetPaths = routeAudit.targetPaths ?? [];
const files = fs
  .readdirSync(path.join(repoRoot, screenshotsDir), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((fileName) => /\.(png|jpe?g|webp)$/i.test(fileName));

const sizeEntries = await Promise.all(files.map(async (fileName) => [fileName, await imageSize(fileName)]));
const sizeMap = new Map(sizeEntries);
const rows = targetPaths.map((targetPath) => classifyFiles(files, targetPath, sizeMap));
const summary = {
  targetCount: rows.length,
  anyPairCount: rows.filter((row) => row.hasAnyPair).length,
  desktopPairCount: rows.filter((row) => row.hasDesktopPair).length,
  mobilePairCount: rows.filter((row) => row.hasMobilePair).length,
  fullViewportPairCount: rows.filter((row) => row.hasDesktopPair && row.hasMobilePair).length,
  missingCount: rows.filter((row) => row.status === "missing").length,
  partialCount: rows.filter((row) => row.status === "partial").length
};

const report = {
  generatedAt: new Date().toISOString(),
  routeAuditPath,
  screenshotsDir,
  summary,
  notes: [
    "This is filename-based visual evidence coverage, not pixel parity proof.",
    "A desktop/mobile pair means at least one target screenshot and one local screenshot exist for that viewport class.",
    "Viewport class is derived from filename labels when present, with image dimensions as a fallback for unlabeled 1280x720 and 390x844 captures.",
    "Use this audit to decide which target/local screenshots and visual diff pairs still need to be captured."
  ],
  rows
};

fs.mkdirSync(path.dirname(path.join(repoRoot, outputPath)), { recursive: true });
fs.writeFileSync(path.join(repoRoot, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(
  [
    `targets=${summary.targetCount}`,
    `anyPair=${summary.anyPairCount}`,
    `desktopPair=${summary.desktopPairCount}`,
    `mobilePair=${summary.mobilePairCount}`,
    `desktopAndMobile=${summary.fullViewportPairCount}`,
    `missing=${summary.missingCount}`,
    `partial=${summary.partialCount}`
  ].join(" ")
);
