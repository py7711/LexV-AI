import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const visualCoveragePath =
  process.argv[2] ?? "docs/research/devoice.io/visual-evidence-coverage-audit-20260701.json";
const screenshotsDir = "docs/design-references/devoice.io";
const pairsOutputPath =
  process.argv[3] ?? "docs/research/devoice.io/visual-diff-auto-pairs-20260701.json";
const reportOutputPath =
  process.argv[4] ?? "docs/research/devoice.io/visual-diff-auto-pairs-report-20260701.json";

const routeSpecificPreferred = {
  "": {
    desktop: {
      target: "target-home-desktop-clean-1440-20260702.png",
      local: "local-home-current-1440-20260702.png"
    }
  },
  blog: {
    desktop: {
      target: "target-blog-desktop-clean-1280-20260702.png",
      local: "local-blog-current-1280-20260702.png"
    },
    mobile: {
      target: "target-blog-mobile-clean-390-20260702.png",
      local: "local-blog-current-390-20260702.png"
    }
  },
  "ai-voice-cloning": {
    desktop: {
      target: "trusted-target-clone-desktop-20260630.png",
      local: "local-clone-desktop-priority-sidebar-child-34-1440-20260701.png"
    },
    mobile: {
      target: "trusted-target-clone-mobile-20260630.png",
      local: "local-clone-mobile-priority-scroll-container-20260701.png"
    }
  },
  "text-to-speech": {
    desktop: {
      target: "trusted-target-tts-desktop-20260630.png",
      local: "local-tts-desktop-priority-sidebar-child-34-1440-20260701.png"
    },
    mobile: {
      target: "trusted-target-tts-mobile-20260630.png",
      local: "local-tts-mobile-priority-scroll-container-20260701.png"
    }
  },
  "ai-noise-filter": {
    desktop: {
      target: "target-ai-noise-filter-desktop-clean-1440-20260702.png",
      local: "local-ai-noise-filter-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-noise-filter-mobile-clean-390-20260702.png",
      local: "local-ai-noise-filter-current-390-20260702.png"
    }
  },
  "ai-voice-enhancer-isolate": {
    desktop: {
      target: "target-ai-voice-enhancer-isolate-desktop-clean-1440-20260702.png",
      local: "local-ai-voice-enhancer-isolate-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-voice-enhancer-isolate-mobile-clean-390-20260702.png",
      local: "local-ai-voice-enhancer-isolate-current-390-20260702.png"
    }
  },
  "ai-dubbing": {
    desktop: {
      target: "target-ai-dubbing-desktop-clean-1440-20260702.png",
      local: "local-ai-dubbing-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-dubbing-mobile-clean-390-20260702.png",
      local: "local-ai-dubbing-current-390-20260702.png"
    }
  },
  "ai-voice-changer": {
    desktop: {
      target: "target-ai-voice-changer-desktop-clean-1440-20260702.png",
      local: "local-ai-voice-changer-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-voice-changer-mobile-clean-390-20260702.png",
      local: "local-ai-voice-changer-current-390-20260702.png"
    }
  },
  "ai-rap-generator": {
    desktop: {
      target: "target-ai-rap-generator-desktop-clean-1440-20260702.png",
      local: "local-ai-rap-generator-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-rap-generator-mobile-clean-390-20260702.png",
      local: "local-ai-rap-generator-current-390-20260702.png"
    }
  },
  "ai-rap-lyrics-generator": {
    desktop: {
      target: "target-ai-rap-lyrics-generator-desktop-clean-1440-20260702.png",
      local: "local-ai-rap-lyrics-generator-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-rap-lyrics-generator-mobile-clean-390-20260702.png",
      local: "local-ai-rap-lyrics-generator-current-390-20260702.png"
    }
  },
  "ai-music-generator": {
    desktop: {
      target: "target-ai-music-generator-desktop-clean-1440-20260702.png",
      local: "local-ai-music-generator-current-1440-20260702.png"
    },
    mobile: {
      target: "target-ai-music-generator-mobile-clean-390-20260702.png",
      local: "local-ai-music-generator-current-390-20260702.png"
    }
  },
  "ai-speech-to-text": {
    mobile: {
      target: "target-ai-speech-to-text-mobile-clean-390-20260702.png",
      local: "local-ai-speech-to-text-current-390-20260702.png"
    },
    desktop: {
      target: "target-ai-speech-to-text-desktop-clean-1440-20260702.png",
      local: "local-ai-speech-to-text-current-1440-20260702.png"
    }
  },
  "payment/loading": {
    desktop: {
      target: "target-payment-loading-desktop.png",
      local: "local-payment-loading-final-20260630.png"
    }
  },
  "payment/result": {
    desktop: {
      target: "target-payment-result-success-desktop.png",
      local: "local-payment-result-success-aligned-20260701.png"
    }
  },
  "demo/text-to-speech": {
    desktop: {
      target: "target-demo-text-to-speech-desktop-clean-1440-20260702.png",
      local: "local-demo-text-to-speech-current-1440-20260702.png"
    }
  },
  pricing: {
    mobile: {
      target: "target-pricing-mobile-clean-390-20260702.png",
      local: "local-pricing-current-390-20260702.png"
    },
    desktop: {
      target: "target-pricing-desktop-clean-1280-20260702.png",
      local: "local-pricing-current-1280-20260702.png"
    }
  },
  "my-resources": {
    mobile: {
      target: "target-my-resources-mobile-clean-390-20260702.png",
      local: "local-my-resources-current-390-20260702.png"
    },
    desktop: {
      target: "target-my-resources.png",
      local: "local-my-resources-current-1280-20260702.png"
    }
  },
  "audio-to-text": {
    mobile: {
      target: "target-audio-to-text-mobile-clean-390-20260702.png",
      local: "local-audio-to-text-current-390-20260702.png"
    },
    desktop: {
      target: "target-audio-to-text-desktop-clean-1440-20260702.png",
      local: "local-audio-to-text-current-1440-20260702.png"
    }
  },
  "video-to-text": {
    mobile: {
      target: "target-video-to-text-mobile-clean-390-20260702.png",
      local: "local-video-to-text-current-390-20260702.png"
    },
    desktop: {
      target: "target-video-to-text-desktop-clean-1440-20260702.png",
      local: "local-video-to-text-current-1440-20260702.png"
    }
  },
  "remove-background-noise": {
    desktop: {
      target: "target-remove-background-noise-desktop-clean-1440-20260702.png",
      local: "local-remove-background-noise-current-1440-20260702.png"
    },
    mobile: {
      target: "target-remove-background-noise-mobile-clean-390-20260702.png",
      local: "local-remove-background-noise-current-390-20260702.png"
    }
  },
  "transcribe-youtube-videos": {
    desktop: {
      target: "target-transcribe-youtube-videos-desktop-clean-1440-20260702.png",
      local: "local-transcribe-youtube-videos-current-1440-20260702.png"
    },
    mobile: {
      target: "target-transcribe-youtube-videos-mobile-clean-390-20260702.png",
      local: "local-transcribe-youtube-videos-current-390-20260702.png"
    }
  },
  "ai-voice-actors": {
    desktop: {
      target: "target-ai-voice-actors-desktop-clean-1440-20260702.png",
      local: "local-ai-voice-actors-current-1440-20260702.png"
    }
  },
  "ai-voice-generator": {
    desktop: {
      target: "target-ai-voice-generator-desktop-clean-1440-20260702.png",
      local: "local-ai-voice-generator-current-1440-20260702.png"
    }
  },
  "terms-of-use": {
    desktop: {
      target: "target-terms-of-use-desktop-clean-1280-20260702.png",
      local: "local-terms-of-use-current-1280-20260702.png"
    }
  },
  "refund-policy": {
    desktop: {
      target: "target-refund-policy-desktop-clean-1280-20260702.png",
      local: "local-refund-policy-current-1280-20260702.png"
    }
  },
  "privacy-policy": {
    desktop: {
      target: "target-privacy-policy-desktop-clean-1280-20260702.png",
      local: "local-privacy-policy-current-1280-20260702.png"
    }
  },
  "audio-extract-from-video": {
    desktop: {
      target: "target-audio-extract-from-video-desktop.png",
      local: "local-audio-extract-from-video-current-1440-20260702.png"
    }
  },
  "blog/how-to-download-youtube-videos": {
    desktop: {
      target: "target-blog-download-youtube-current-1280-20260701.png",
      local: "local-blog-download-youtube-current-1280-final-20260701.png"
    },
    mobile: {
      target: "target-blog-how-to-download-youtube-videos-mobile-clean-390-20260702.png",
      local: "local-blog-how-to-download-youtube-videos-current-390-20260702.png"
    }
  },
  "blog/how-to-remove-music-from-video": {
    desktop: {
      target: "target-blog-how-to-remove-music-from-video-desktop-clean-1440-20260702.png",
      local: "local-blog-how-to-remove-music-from-video-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-how-to-remove-music-from-video-mobile-clean-390-20260702.png",
      local: "local-blog-how-to-remove-music-from-video-current-390-20260702.png"
    }
  },
  "blog/remove-background-noise-and-background-conversation": {
    desktop: {
      target: "target-blog-remove-background-noise-and-background-conversation-desktop-clean-1440-20260702.png",
      local: "local-blog-remove-background-noise-and-background-conversation-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-remove-background-noise-and-background-conversation-mobile-clean-390-20260702.png",
      local: "local-blog-remove-background-noise-and-background-conversation-current-390-20260702.png"
    }
  },
  "blog/remove-lead-vocals-from-songs": {
    desktop: {
      target: "target-blog-remove-lead-vocals-from-songs-desktop-clean-1440-20260702.png",
      local: "local-blog-remove-lead-vocals-from-songs-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-remove-lead-vocals-from-songs-mobile-clean-390-20260702.png",
      local: "local-blog-remove-lead-vocals-from-songs-current-390-20260702.png"
    }
  },
  "blog/how-to-get-the-audio-from-a-video": {
    desktop: {
      target: "target-blog-how-to-get-the-audio-from-a-video-desktop-clean-1440-20260702.png",
      local: "local-blog-how-to-get-the-audio-from-a-video-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-how-to-get-the-audio-from-a-video-mobile-clean-390-20260702.png",
      local: "local-blog-how-to-get-the-audio-from-a-video-current-390-20260702.png"
    }
  },
  "blog/how-to-extract-audio-from-video": {
    desktop: {
      target: "target-blog-how-to-extract-audio-from-video-desktop-clean-1440-20260702.png",
      local: "local-blog-how-to-extract-audio-from-video-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-how-to-extract-audio-from-video-mobile-clean-390-20260702.png",
      local: "local-blog-how-to-extract-audio-from-video-current-390-20260702.png"
    }
  },
  "blog/remove-background-music-from-audio": {
    desktop: {
      target: "target-blog-remove-background-music-from-audio-desktop-clean-1440-20260702.png",
      local: "local-blog-remove-background-music-from-audio-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-remove-background-music-from-audio-mobile-clean-390-20260702.png",
      local: "local-blog-remove-background-music-from-audio-current-390-20260702.png"
    }
  },
  "blog/ai-noise-remover-tools-for-dynamic-noise-reduction-online": {
    desktop: {
      target: "target-blog-ai-noise-remover-tools-for-dynamic-noise-reduction-online-desktop-clean-1440-20260702.png",
      local: "local-blog-ai-noise-remover-tools-for-dynamic-noise-reduction-online-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-ai-noise-remover-tools-for-dynamic-noise-reduction-online-mobile-clean-390-20260702.png",
      local: "local-blog-ai-noise-remover-tools-for-dynamic-noise-reduction-online-current-390-20260702.png"
    }
  },
  "blog/exploring-ai-vocal-cleaner-clean-up-audios": {
    desktop: {
      target: "target-blog-exploring-ai-vocal-cleaner-clean-up-audios-desktop-clean-1440-20260702.png",
      local: "local-blog-exploring-ai-vocal-cleaner-clean-up-audios-current-1440-20260702.png"
    },
    mobile: {
      target: "target-blog-exploring-ai-vocal-cleaner-clean-up-audios-mobile-clean-390-20260702.png",
      local: "local-blog-exploring-ai-vocal-cleaner-clean-up-audios-current-390-20260702.png"
    }
  },
  "youtube-transcript-generator": {
    desktop: {
      target: "target-youtube-transcript-generator-desktop-clean-1280-20260702.png",
      local: "local-youtube-transcript-generator-current-1280-20260702.png"
    }
  },
  "youtube-subtitle-downloader": {
    desktop: {
      target: "target-youtube-subtitle-downloader-desktop-clean-1280-20260702.png",
      local: "local-youtube-subtitle-downloader-current-1280-20260702.png"
    }
  },
  "youtube-video-summarizer": {
    desktop: {
      target: "target-youtube-video-summarizer-desktop-clean-1280-20260702.png",
      local: "local-youtube-video-summarizer-current-1280-20260702.png"
    }
  }
};

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function existsScreenshot(fileName) {
  return fs.existsSync(path.join(absolute(screenshotsDir), fileName));
}

async function imageSize(fileName) {
  try {
    const metadata = await sharp(path.join(absolute(screenshotsDir), fileName)).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

function viewportSizeScore(size, viewport) {
  if (!size || viewport === "generic") return 0;
  let score = 0;

  if (viewport === "mobile") {
    if (size.width === 390) score += 70;
    if (size.height === 844) score += 90;
    if (size.width === 390 && size.height === 844) score += 90;
    if (size.width === 1280 && size.height === 720) score -= 120;
    if (size.width === 390 && size.height > 1200) score -= 160;
    if (size.height > 2000) score -= 80;
  }

  if (viewport === "desktop") {
    if (size.width >= 1200 && size.height >= 700 && size.height <= 1000) score += 70;
    if (size.width === 390) score -= 120;
    if (size.height > 1400) score -= 100;
  }

  return score;
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

function pairSizeScore(targetSize, localSize, viewport) {
  if (!targetSize || !localSize || viewport === "generic") return 0;
  let score = 0;

  if (targetSize.width === localSize.width) score += 70;
  if (targetSize.height === localSize.height) score += 90;
  if (targetSize.width === localSize.width && targetSize.height === localSize.height) score += 90;

  const sameWidth = targetSize.width === localSize.width;
  const localMuchTaller = sameWidth && localSize.height > targetSize.height * 1.8;
  const targetMuchTaller = sameWidth && targetSize.height > localSize.height * 1.8;
  if (localMuchTaller || targetMuchTaller) score -= 260;

  if (viewport === "mobile" && targetSize.width === 390 && localSize.width === 390) score += 45;
  if (viewport === "desktop" && targetSize.width >= 1200 && localSize.width >= 1200) score += 45;

  return score;
}

function fileScore(fileName, viewport, side, size = null, route = "") {
  const normalized = fileName.toLowerCase();
  const normalizedRoute = route.toLowerCase();
  let score = 0;

  if (viewport === "generic") {
    if (!normalized.includes("desktop") && !normalized.includes("mobile")) score += 80;
  } else if (normalized.includes(viewport)) {
    score += 80;
  }
  if (normalized.includes("trusted")) score += 70;
  if (normalized.includes("current")) score += 55;
  if (normalized.includes("final")) score += 45;
  if (normalized.includes("aligned")) score += 40;
  if (normalized.includes("post")) score += 25;
  if (normalized.includes("full")) score += 20;
  if (normalized.includes("clean")) score += 15;
  if (normalized.includes("20260701")) score += 12;
  if (normalized.includes("20260630")) score += 6;
  if (side === "target" && normalized.startsWith("trusted-target")) score += 30;
  if (side === "local" && normalized.startsWith("trusted-local")) score += 20;
  if (!normalizedRoute.startsWith("blog/") && (normalized.startsWith("target-blog-") || normalized.startsWith("local-blog-"))) score -= 240;
  if (normalizedRoute.startsWith("blog/") && !normalized.includes("blog-")) score -= 80;
  score += viewportSizeScore(size, viewport);

  const statePenaltyWords = [
    "dropdown",
    "toast",
    "validation",
    "trigger",
    "focus-ring",
    "font-weight",
    "typography",
    "voice-row",
    "voice-list",
    "language",
    "generate-empty",
    "interaction",
    "combobox",
    "overlay",
    "badge",
    "example-headphones",
    "scroll",
    "anon-actions",
    "footer-hidden",
    "glow",
    "brand",
    "description"
  ];

  for (const word of statePenaltyWords) {
    if (normalized.includes(word)) score -= 50;
  }

  if (viewport === "generic") {
    if (normalized.includes("desktop") || normalized.includes("mobile")) score -= 100;
  } else if (!normalized.includes(viewport)) {
    score -= 100;
  }

  return score;
}

function choose(files, viewport, side, sizeMap, route = "") {
  const viewportFiles =
    viewport === "generic"
      ? files.filter((fileName) => viewportKind(fileName, sizeMap) === "generic")
      : files.filter((fileName) => viewportKind(fileName, sizeMap) === viewport);
  if (!viewportFiles.length) return null;
  return viewportFiles.toSorted((a, b) => fileScore(b, viewport, side, sizeMap.get(b), route) - fileScore(a, viewport, side, sizeMap.get(a), route) || a.localeCompare(b))[0] ?? null;
}

function choosePair(targetFiles, localFiles, viewport, sizeMap, route = "") {
  const viewportTargets =
    viewport === "generic"
      ? targetFiles.filter((fileName) => viewportKind(fileName, sizeMap) === "generic")
      : targetFiles.filter((fileName) => viewportKind(fileName, sizeMap) === viewport);
  const viewportLocals =
    viewport === "generic"
      ? localFiles.filter((fileName) => viewportKind(fileName, sizeMap) === "generic")
      : localFiles.filter((fileName) => viewportKind(fileName, sizeMap) === viewport);

  if (!viewportTargets.length || !viewportLocals.length) return null;

  let best = null;
  for (const targetFile of viewportTargets) {
    for (const localFile of viewportLocals) {
      const targetSize = sizeMap.get(targetFile);
      const localSize = sizeMap.get(localFile);
      const score =
        fileScore(targetFile, viewport, "target", targetSize, route) +
        fileScore(localFile, viewport, "local", localSize, route) +
        pairSizeScore(targetSize, localSize, viewport);
      const candidate = { targetFile, localFile, score, targetSize, localSize };
      if (
        !best ||
        candidate.score > best.score ||
        (candidate.score === best.score && `${candidate.targetFile}:${candidate.localFile}`.localeCompare(`${best.targetFile}:${best.localFile}`) < 0)
      ) {
        best = candidate;
      }
    }
  }

  return best;
}

function addPair(pairs, route, viewport, targetFile, localFile, source) {
  pairs.push({
    name: `${(route || "home").replaceAll("/", "-")}-${viewport}`,
    target: path.join(screenshotsDir, targetFile),
    local: path.join(screenshotsDir, localFile),
    route,
    viewport,
    source
  });
}

const coverage = readJson(visualCoveragePath);
const allCandidateFiles = new Set();
for (const row of coverage.rows ?? []) {
  for (const fileName of [...(row.files?.target ?? row.sampleFiles?.target ?? []), ...(row.files?.local ?? row.sampleFiles?.local ?? [])]) {
    allCandidateFiles.add(fileName);
  }
}
for (const preferred of Object.values(routeSpecificPreferred)) {
  for (const viewport of Object.values(preferred)) {
    allCandidateFiles.add(viewport.target);
    allCandidateFiles.add(viewport.local);
  }
}
const sizeEntries = await Promise.all(
  [...allCandidateFiles].map(async (fileName) => [fileName, await imageSize(fileName)])
);
const sizeMap = new Map(sizeEntries);
const pairs = [];
const skipped = [];

for (const row of coverage.rows ?? []) {
  const preferred = routeSpecificPreferred[row.targetPath];

  for (const viewport of ["desktop", "mobile", "generic"]) {
    const hasViewportPair =
      viewport === "desktop"
        ? row.hasDesktopPair
        : viewport === "mobile"
          ? row.hasMobilePair
          : row.hasAnyPair && !row.hasDesktopPair && !row.hasMobilePair;
    if (!hasViewportPair) {
      skipped.push({
        targetPath: row.targetPath,
        viewport,
        reason: "missing-target-or-local-viewport-pair",
        counts: row.counts
      });
      continue;
    }

    const preferredViewport = preferred?.[viewport];
    if (
      preferredViewport &&
      existsScreenshot(preferredViewport.target) &&
      existsScreenshot(preferredViewport.local)
    ) {
      addPair(pairs, row.targetPath, viewport, preferredViewport.target, preferredViewport.local, "route-specific-preferred");
      continue;
    }

    const targetFiles = row.files?.target ?? row.sampleFiles?.target ?? [];
    const localFiles = row.files?.local ?? row.sampleFiles?.local ?? [];
    const sizeAwarePair = choosePair(targetFiles, localFiles, viewport, sizeMap, row.targetPath);
    const targetFile = sizeAwarePair?.targetFile ?? choose(targetFiles, viewport, "target", sizeMap, row.targetPath);
    const localFile = sizeAwarePair?.localFile ?? choose(localFiles, viewport, "local", sizeMap, row.targetPath);

    if (!targetFile || !localFile) {
      skipped.push({
        targetPath: row.targetPath,
        viewport,
        reason: "no-ranked-screenshot-candidate",
        counts: row.counts
      });
      continue;
    }

    addPair(pairs, row.targetPath, viewport, targetFile, localFile, sizeAwarePair ? "size-aware-ranked-candidate" : "ranked-filename-candidate");
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  visualCoveragePath,
  screenshotsDir,
  pairsOutputPath,
  summary: {
    targetRouteCount: coverage.summary?.targetCount ?? 0,
    pairCount: pairs.length,
    routeCountWithAtLeastOnePair: new Set(pairs.map((pair) => pair.route)).size,
    desktopPairCount: pairs.filter((pair) => pair.viewport === "desktop").length,
    mobilePairCount: pairs.filter((pair) => pair.viewport === "mobile").length,
    genericPairCount: pairs.filter((pair) => pair.viewport === "generic").length,
    skippedCount: skipped.length
  },
  notes: [
    "Pairs are generated from existing screenshot filenames only; this is a visual-diff work queue, not a claim of parity.",
    "Priority routes use trusted explicit screenshot pairs. Other routes use conservative filename ranking and may still require manual review.",
    "Non-preferred candidates are ranked with image metadata when available, favoring same-size viewport captures and penalizing local full-page captures paired against target viewports.",
    "Routes without both target and local screenshots for a viewport are skipped until captures are added."
  ],
  pairs,
  skipped
};

fs.mkdirSync(path.dirname(absolute(pairsOutputPath)), { recursive: true });
fs.writeFileSync(absolute(pairsOutputPath), `${JSON.stringify(pairs, null, 2)}\n`);
fs.writeFileSync(absolute(reportOutputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${pairsOutputPath}`);
console.log(`Wrote ${reportOutputPath}`);
console.log(
  [
    `pairs=${report.summary.pairCount}`,
    `routes=${report.summary.routeCountWithAtLeastOnePair}`,
    `desktop=${report.summary.desktopPairCount}`,
    `mobile=${report.summary.mobilePairCount}`,
    `generic=${report.summary.genericPairCount}`,
    `skipped=${report.summary.skippedCount}`
  ].join(" ")
);
