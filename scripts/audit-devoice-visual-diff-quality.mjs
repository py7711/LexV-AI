import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const resultsPath =
  process.argv[2] ?? "docs/research/devoice.io/visual-diff-auto-pairs-results-20260701.json";
const outputPath =
  process.argv[3] ?? "docs/research/devoice.io/visual-diff-quality-audit-20260701.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function normalizedBasename(filePath) {
  return path.basename(filePath).toLowerCase();
}

function sizeLabel(size) {
  return `${size.width}x${size.height}`;
}

function isDesktopLike(size) {
  return size.width >= 1000 && size.height <= 950;
}

function isMobileLike(size) {
  return size.width <= 500 && size.height >= 650;
}

function hasStrongDimensionMismatch(targetSize, localSize) {
  const widthRatio = Math.max(targetSize.width, localSize.width) / Math.max(1, Math.min(targetSize.width, localSize.width));
  const heightRatio = Math.max(targetSize.height, localSize.height) / Math.max(1, Math.min(targetSize.height, localSize.height));
  return widthRatio >= 1.75 || heightRatio >= 1.75;
}

function inferViewportLabel(pair) {
  if (pair.viewport) return pair.viewport;
  if (pair.name.includes("-mobile")) return "mobile";
  if (pair.name.includes("-desktop")) return "desktop";
  return null;
}

async function topBandStats(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    const image = sharp(fullPath);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) return null;
    const height = Math.min(176, metadata.height);
    const stats = await image.extract({ left: 0, top: 0, width: metadata.width, height }).stats();
    const [red, green, blue] = stats.channels.slice(0, 3).map((channel) => channel.mean);
    return {
      red,
      green,
      blue,
      brightness: (red + green + blue) / 3,
      greenMinusBlue: green - blue,
      greenMinusRed: green - red
    };
  } catch {
    return null;
  }
}

async function imageStats(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    const stats = await sharp(fullPath).stats();
    const channels = stats.channels.slice(0, 3);
    const means = channels.map((channel) => channel.mean);
    const stdevs = channels.map((channel) => channel.stdev);
    return {
      means,
      stdevs,
      meanBrightness: means.reduce((sum, value) => sum + value, 0) / Math.max(1, means.length),
      meanStdev: stdevs.reduce((sum, value) => sum + value, 0) / Math.max(1, stdevs.length)
    };
  } catch {
    return null;
  }
}

function hasLikelyPromoTopBand(stats) {
  if (!stats) return false;
  return stats.brightness >= 52 && stats.greenMinusRed >= 14 && stats.blue >= 55;
}

function isLikelyBlankOrPartialCapture(stats) {
  if (!stats) return false;
  return stats.meanBrightness <= 24 && stats.meanStdev <= 8;
}

function hasKnownTargetSidebarStateMismatch(pair) {
  return pair.name === "ai-speech-to-text-desktop";
}

function hasKnownTargetOverlayOrPromoState(pair) {
  return pair.name === "blog-desktop";
}

function hasKnownPolicyTargetRewardOverlay(pair) {
  return [
    "pricing-desktop",
    "terms-of-use-desktop",
    "refund-policy-desktop",
    "privacy-policy-desktop"
  ].includes(pair.name);
}

function hasLikelyTargetAuthState(targetStats, localStats) {
  if (!targetStats || !localStats) return false;
  return targetStats.meanBrightness >= 235 && localStats.meanBrightness <= 70;
}

function hasKnownTargetHorizontalCrop(pair) {
  const targetName = normalizedBasename(pair.target);
  if (targetName.includes("clean") && targetName.includes("20260702")) return false;
  return (
    pair.name === "video-to-text-mobile" ||
    pair.name === "video-to-text-desktop" ||
    pair.name === "audio-to-text-mobile" ||
    pair.name === "ai-rap-generator-mobile" ||
    pair.name === "ai-voice-enhancer-isolate-desktop" ||
    pair.name === "ai-dubbing-desktop" ||
    pair.name === "ai-voice-changer-desktop" ||
    pair.name === "ai-noise-filter-desktop" ||
    pair.name === "remove-background-noise-desktop" ||
    pair.name === "transcribe-youtube-videos-desktop" ||
    pair.name === "ai-music-generator-desktop" ||
    pair.name === "ai-rap-generator-desktop" ||
    pair.name === "ai-rap-lyrics-generator-desktop"
  );
}

function hasKnownAlignedArticleGeometryWithShellStateDiff(pair) {
  return pair.name === "blog-how-to-download-youtube-videos-desktop";
}

function hasKnownBlogDesktopAutoStateMismatch(pair, targetName, localName) {
  return (
    pair.name.startsWith("blog-") &&
    pair.name.endsWith("-desktop") &&
    targetName.includes("desktop-auto") &&
    localName.includes("desktop-auto")
  );
}

function hasKnownYouTubeTargetRewardOverlay(pair) {
  return [
    "youtube-transcript-generator-desktop",
    "youtube-subtitle-downloader-desktop",
    "youtube-video-summarizer-desktop"
  ].includes(pair.name);
}

function hasKnownStaleLocalPublicToolShellCapture(pair, localName) {
  return (
    [
      "ai-voice-enhancer-isolate-desktop",
      "ai-dubbing-desktop",
      "ai-voice-changer-desktop"
    ].includes(pair.name) &&
    localName.includes("desktop-auto") &&
    !localName.includes("current-compact-audit")
  );
}

function hasKnownStalePublicToolShellEvidence(pair) {
  const targetName = normalizedBasename(pair.target);
  const localName = normalizedBasename(pair.local);
  if (targetName.includes("clean") && targetName.includes("20260702") && localName.includes("current") && localName.includes("20260702")) return false;
  return [
    "ai-voice-actors-desktop",
    "ai-voice-generator-desktop"
  ].includes(pair.name);
}

async function classify(pair) {
  const targetName = normalizedBasename(pair.target);
  const localName = normalizedBasename(pair.local);
  const viewportLabel = inferViewportLabel(pair);
  const targetTopBand = viewportLabel === "mobile" ? await topBandStats(pair.target) : null;
  const localTopBand = viewportLabel === "mobile" ? await topBandStats(pair.local) : null;
  const [targetImageStats, localImageStats] = await Promise.all([imageStats(pair.target), imageStats(pair.local)]);
  const reasons = [];
  let bucket = "credible-ui-diff";
  let priority = "medium";

  const sameWidth = pair.targetSize.width === pair.localSize.width;
  const sameHeight = pair.targetSize.height === pair.localSize.height;
  const localMuchTaller = sameWidth && pair.localSize.height > pair.targetSize.height * 1.8;
  const targetMuchTaller = sameWidth && pair.targetSize.height > pair.localSize.height * 1.8;
  const mobileLabelDesktopCapture =
    viewportLabel === "mobile" && (isDesktopLike(pair.targetSize) || isDesktopLike(pair.localSize));
  const desktopLabelMobileCapture =
    viewportLabel === "desktop" && (isMobileLike(pair.targetSize) || isMobileLike(pair.localSize));
  const crossViewportShape =
    (isDesktopLike(pair.targetSize) && isMobileLike(pair.localSize)) ||
    (isMobileLike(pair.targetSize) && isDesktopLike(pair.localSize));

  const targetBlankOrPartial = isLikelyBlankOrPartialCapture(targetImageStats);
  const localBlankOrPartial = isLikelyBlankOrPartialCapture(localImageStats);
  const targetIsClean20260702 = targetName.includes("clean") && targetName.includes("20260702");
  const localIsCurrent20260702 = localName.includes("current") && localName.includes("20260702");

  if (pair.name.includes("generic")) {
    bucket = "generic-untrusted-pair";
    priority = "low";
    reasons.push("generic pair lacks desktop/mobile viewport label");
  }

  if (targetBlankOrPartial || localBlankOrPartial) {
    bucket = "blank-or-partial-capture";
    priority = "high";
    reasons.push(
      `image statistics suggest blank/partial capture targetBrightness=${targetImageStats ? Math.round(targetImageStats.meanBrightness) : "unknown"} targetStdev=${targetImageStats ? Math.round(targetImageStats.meanStdev) : "unknown"} localBrightness=${localImageStats ? Math.round(localImageStats.meanBrightness) : "unknown"} localStdev=${localImageStats ? Math.round(localImageStats.meanStdev) : "unknown"}`
    );
  }

  if (hasKnownTargetSidebarStateMismatch(pair) && !targetIsClean20260702) {
    bucket = "target-sidebar-state-mismatch";
    priority = "high";
    reasons.push("known target capture shows Home highlighted in the sidebar while the route pair is ai-speech-to-text");
  }

  if (pair.name === "ai-speech-to-text-mobile" && targetIsClean20260702) {
    bucket = "target-route-redirect";
    priority = "high";
    reasons.push("clean target recapture for /ai-speech-to-text redirects to the home page; do not tune local route geometry against this target image");
  }

  if (hasKnownTargetOverlayOrPromoState(pair) && !targetIsClean20260702) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push("known target capture includes promo bar and daily credit popup overlay rather than a clean blog page state");
  }

  if (hasKnownPolicyTargetRewardOverlay(pair) && !targetIsClean20260702) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push("known target policy capture includes the daily reward popup overlay; current local policy recaptures intentionally suppress automatic public-page reward popups while keeping manual check-in available");
  }

  if (hasLikelyTargetAuthState(targetImageStats, localImageStats)) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push(
      `target image is much brighter than local and likely captures an auth/blank overlay state targetBrightness=${Math.round(targetImageStats.meanBrightness)} localBrightness=${Math.round(localImageStats.meanBrightness)}`
    );
  }

  if (hasKnownTargetHorizontalCrop(pair)) {
    bucket = "target-horizontal-crop";
    priority = "high";
    reasons.push("known target mobile capture is horizontally shifted/cropped with the upload panel extending beyond the 390px viewport");
  }

  if (hasKnownAlignedArticleGeometryWithShellStateDiff(pair)) {
    bucket = "article-geometry-aligned-shell-diff";
    priority = "low";
    reasons.push("current target/local article title and hero geometry align; remaining full-viewport diff is dominated by shell/sidebar state");
  }

  if (hasKnownBlogDesktopAutoStateMismatch(pair, targetName, localName)) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push("blog desktop auto target/local captures include inconsistent promo/sidebar/check-in states; current 1440 local recapture keeps the clean 705px article column and should be paired only with a clean target recapture");
  }

  if (hasKnownYouTubeTargetRewardOverlay(pair) && !targetIsClean20260702) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push("known target YouTube capture includes authenticated/promo/daily reward overlay state; current local clean geometry should be compared against a clean recapture before UI tuning");
  }

  if (hasKnownStaleLocalPublicToolShellCapture(pair, localName)) {
    bucket = "stale-local-capture";
    priority = "high";
    reasons.push("local screenshot predates the current public collapsed shell contract and shows the old expanded sidebar; recapture before UI tuning");
  }

  if (hasKnownStalePublicToolShellEvidence(pair)) {
    bucket = "stale-public-tool-shell-evidence";
    priority = "high";
    reasons.push("target/local evidence predates the current public collapsed shell contract; recapture both sides before tuning this shared voice tool template");
  }

  if (mobileLabelDesktopCapture || desktopLabelMobileCapture || crossViewportShape) {
    bucket = "viewport-dimension-mismatch";
    priority = "high";
    reasons.push(
      `viewport label/dimensions disagree target=${sizeLabel(pair.targetSize)} local=${sizeLabel(pair.localSize)} label=${viewportLabel ?? "unlabeled"}`
    );
  } else if (!sameWidth && !sameHeight && hasStrongDimensionMismatch(pair.targetSize, pair.localSize)) {
    bucket = "viewport-dimension-mismatch";
    priority = "high";
    reasons.push(
      `strong cross-dimension mismatch target=${sizeLabel(pair.targetSize)} local=${sizeLabel(pair.localSize)} label=${viewportLabel ?? "unlabeled"}`
    );
  }

  if (localMuchTaller || targetMuchTaller) {
    bucket = "viewport-fullpage-mismatch";
    priority = "high";
    reasons.push(
      `same width but mismatched height target=${sizeLabel(pair.targetSize)} local=${sizeLabel(pair.localSize)}`
    );
  }

  if (
    targetName.includes("overlay") ||
    localName.includes("overlay") ||
    targetName.includes("current") ||
    localName.includes("current")
  ) {
    reasons.push("filename suggests transient UI state such as overlay/current capture");
  }

  if (
    viewportLabel === "mobile" &&
    sameWidth &&
    sameHeight &&
    hasLikelyPromoTopBand(targetTopBand) &&
    !hasLikelyPromoTopBand(localTopBand)
  ) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push(
      `target top band looks like a promo/banner state targetBrightness=${Math.round(targetTopBand.brightness)} localBrightness=${localTopBand ? Math.round(localTopBand.brightness) : "unknown"}`
    );
  }

  if (pair.name === "ai-speech-to-text-mobile" && !targetIsClean20260702) {
    bucket = "target-state-polluted";
    priority = "high";
    reasons.push("known target capture resolves to home/promo/check-in overlay state rather than pure route component");
  }

  if (pair.name.includes("blog") && pair.name.includes("mobile")) {
    if (bucket === "credible-ui-diff") {
      bucket = "likely-long-page-crop-mismatch";
      priority = "medium";
    }
    reasons.push("mobile blog routes commonly compare target viewport against local long-page capture");
  }

  if (
    bucket !== "target-route-redirect" &&
    pair.mismatchRatio <= 0.15 &&
    sameWidth &&
    (sameHeight || Math.abs(pair.targetSize.height - pair.localSize.height) <= 20)
  ) {
    bucket = "trusted-low-mismatch";
    priority = "low";
    reasons.push("same-size pair with low mismatch ratio");
  }

  if (targetIsClean20260702 && localIsCurrent20260702) {
    reasons.push("uses clean 20260702 target recapture and current 20260702 local viewport capture");
  }

  if (pair.name.includes("text-to-speech") || pair.name.includes("ai-voice-cloning")) {
    if (pair.source === "route-specific-preferred" || targetName.includes("trusted-target")) {
      reasons.push("priority route-specific preferred/trusted pair");
    }
  }

  if (pair.mismatchRatio >= 0.5 && bucket === "credible-ui-diff") {
    priority = "high";
    reasons.push("high mismatch with no automatic invalid-pair signal");
  }

  return {
    name: pair.name,
    route: pair.route,
    viewport: viewportLabel,
    source: pair.source ?? null,
    bucket,
    priority,
    mismatchRatio: pair.mismatchRatio,
    meanAbsoluteError: pair.meanAbsoluteError,
    rootMeanSquaredError: pair.rootMeanSquaredError,
    target: pair.target,
    local: pair.local,
    targetSize: pair.targetSize,
    localSize: pair.localSize,
    targetTopBand,
    localTopBand,
    targetImageStats,
    localImageStats,
    reasons
  };
}

const results = readJson(resultsPath);
const classified = (await Promise.all((results.pairs ?? []).map(classify)))
  .sort((a, b) => {
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return (
      priorityRank[a.priority] - priorityRank[b.priority] ||
      b.mismatchRatio - a.mismatchRatio ||
      a.name.localeCompare(b.name)
    );
  });

const buckets = {};
for (const row of classified) {
  buckets[row.bucket] ??= {
    count: 0,
    maxMismatch: 0,
    examples: []
  };
  buckets[row.bucket].count += 1;
  buckets[row.bucket].maxMismatch = Math.max(buckets[row.bucket].maxMismatch, row.mismatchRatio);
  if (buckets[row.bucket].examples.length < 8) {
    buckets[row.bucket].examples.push({
      name: row.name,
      mismatchRatio: row.mismatchRatio,
      targetSize: row.targetSize,
      localSize: row.localSize,
      reasons: row.reasons
    });
  }
}

const highConfidenceUiWork = classified
  .filter((row) => row.bucket === "credible-ui-diff" && row.priority === "high")
  .slice(0, 12);
const pairCleanupQueue = classified
  .filter((row) =>
    [
      "viewport-dimension-mismatch",
      "blank-or-partial-capture",
      "target-sidebar-state-mismatch",
      "target-horizontal-crop",
      "article-geometry-aligned-shell-diff",
      "viewport-fullpage-mismatch",
      "target-state-polluted",
      "stale-local-capture",
      "stale-public-tool-shell-evidence",
      "generic-untrusted-pair",
      "likely-long-page-crop-mismatch"
    ].includes(row.bucket)
  )
  .slice(0, 20);

const report = {
  generatedAt: new Date().toISOString(),
  resultsPath,
  totalPairs: classified.length,
  buckets,
  highConfidenceUiWork,
  pairCleanupQueue,
  notes: [
    "This audit classifies existing visual diff pairs by evidence quality. It does not change screenshots or assert visual parity.",
    "viewport-dimension-mismatch rows should be replaced with captures whose actual image size matches the viewport label before UI tuning.",
    "blank-or-partial-capture rows should be recaptured because at least one side looks like a blank, partially loaded, or misframed screenshot.",
    "target-sidebar-state-mismatch rows should be recaptured or demoted because the target navigation state does not match the route being compared.",
    "target-horizontal-crop rows should be recaptured because the target viewport shows a horizontally shifted/cropped state rather than a stable mobile layout.",
    "stale-local-capture rows should be recaptured because the local screenshot no longer represents the current implementation.",
    "stale-public-tool-shell-evidence rows should be recaptured on both target and local because the pair predates the current shared public tool shell contract.",
    "article-geometry-aligned-shell-diff rows have current component geometry evidence, but whole-viewport pixel scores still include shell/sidebar state differences.",
    "viewport-fullpage-mismatch rows should usually be fixed by replacing the local or target image with a same-state viewport capture before tuning UI.",
    "credible-ui-diff rows are better candidates for implementation work because this script did not detect obvious screenshot-state or size-pairing problems.",
    "Priority Text to Speech and AI Voice Cloning pairs remain trusted low-mismatch pairs in the current matrix."
  ],
  classified
};

fs.mkdirSync(path.dirname(path.join(repoRoot, outputPath)), { recursive: true });
fs.writeFileSync(path.join(repoRoot, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(
  Object.entries(buckets)
    .map(([bucket, value]) => `${bucket}=${value.count}`)
    .join(" ")
);
