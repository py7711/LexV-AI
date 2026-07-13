import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const routeAuditPath = process.argv[2] ?? "docs/research/devoice.io/route-coverage-audit-20260701-current.json";
const outputPath = process.argv[3] ?? "docs/research/devoice.io/evidence-coverage-audit-20260701.json";
const researchDir = path.join(repoRoot, "docs/research/devoice.io");
const designDir = path.join(repoRoot, "docs/design-references/devoice.io");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function aliasesFor(targetPath) {
  if (targetPath === "") {
    return ["home", "root", "index"];
  }

  const slug = normalize(targetPath);
  const parts = slug.split("-");
  const aliases = new Set([slug, targetPath.toLowerCase()]);

  if (targetPath.startsWith("blog/")) {
    aliases.add("blog");
    aliases.add(normalize(targetPath.replace("blog/", "")));
  }

  if (targetPath === "text-to-speech") {
    aliases.add("tts");
    aliases.add("priority");
    aliases.add("voice");
  }

  if (targetPath === "ai-voice-cloning") {
    aliases.add("clone");
    aliases.add("voice-cloning");
    aliases.add("priority");
    aliases.add("voice");
  }

  if (targetPath.startsWith("youtube-") || targetPath === "transcribe-youtube-videos") {
    aliases.add("youtube");
  }

  if (["audio-to-text", "video-to-text", "ai-speech-to-text"].includes(targetPath)) {
    aliases.add("transcriber");
  }

  if (["ai-music-generator", "ai-rap-generator", "ai-rap-lyrics-generator"].includes(targetPath)) {
    aliases.add("generator");
  }

  if (["privacy-policy", "refund-policy", "terms-of-use"].includes(targetPath)) {
    aliases.add("policy");
  }

  if (targetPath.startsWith("payment/")) {
    aliases.add("payment");
    aliases.add(parts.at(-1) ?? "");
  }

  return [...aliases].filter(Boolean);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

const routeAudit = readJson(routeAuditPath);
const researchFiles = listFiles(researchDir);
const designFiles = listFiles(designDir);
const allEvidenceFiles = [...researchFiles, ...designFiles].map((file) => ({
  file,
  normalized: normalize(file)
}));

function evidenceSignals(file) {
  if (!file.endsWith(".json")) {
    return { hasTargetSignal: normalize(file).includes("target"), hasLocalSignal: normalize(file).includes("local") };
  }

  try {
    const raw = fs.readFileSync(path.join(researchDir, file), "utf8");
    const normalized = normalize(file);
    return {
      hasTargetSignal: normalized.includes("target") || /"(?:target|targetUrl|targetFacts|targetDom|targetTitle|targetH1|targetMetrics|targetScreenshot|targetPath)"\s*:/i.test(raw),
      hasLocalSignal: normalized.includes("local") || /"(?:local|localUrl|localDom|localDesktop|localMobile|localMetrics|localScreenshot|localPath)"\s*:/i.test(raw)
    };
  } catch {
    return { hasTargetSignal: normalize(file).includes("target"), hasLocalSignal: normalize(file).includes("local") };
  }
}

const evidenceByPath = routeAudit.targetPaths.map((targetPath) => {
  const aliases = aliasesFor(targetPath);
  const matchesAlias = (file, dir) => {
    const normalized = normalize(file);
    if (aliases.some((alias) => alias && normalized.includes(normalize(alias)))) {
      return true;
    }
    if (!file.endsWith(".json")) {
      return false;
    }
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8").toLowerCase();
      return aliases.some((alias) => {
        const plainAlias = alias.toLowerCase();
        return plainAlias && (raw.includes(`/${plainAlias}`) || raw.includes(`"${plainAlias}"`) || raw.includes(plainAlias));
      });
    } catch {
      return false;
    }
  };
  const matchedResearchFiles = researchFiles.filter((file) => {
    return matchesAlias(file, researchDir);
  }).sort();
  const matchedDesignFiles = designFiles.filter((file) => {
    return matchesAlias(file, designDir);
  }).sort();
  const researchSignals = matchedResearchFiles.map(evidenceSignals);
  const hasTargetEvidence = researchSignals.some((signal) => signal.hasTargetSignal) ||
    matchedDesignFiles.some((file) => normalize(file).includes("target"));
  const hasLocalEvidence = researchSignals.some((signal) => signal.hasLocalSignal) ||
    matchedDesignFiles.some((file) => normalize(file).includes("local"));
  const evidenceCount = matchedResearchFiles.length + matchedDesignFiles.length;

  return {
    targetPath,
    aliases,
    evidenceCount,
    hasTargetEvidence,
    hasLocalEvidence,
    matchedResearchFiles,
    matchedDesignFiles,
    status: hasTargetEvidence && hasLocalEvidence ? "covered" : evidenceCount > 0 ? "partial" : "missing"
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  routeAuditPath,
  targetCount: routeAudit.targetPaths.length,
  coveredCount: evidenceByPath.filter((item) => item.status === "covered").length,
  partialCount: evidenceByPath.filter((item) => item.status === "partial").length,
  missingCount: evidenceByPath.filter((item) => item.status === "missing").length,
  notes: [
    "This is a filename-based evidence index, not proof of visual parity.",
    "A covered route has at least one target-named and one local-named evidence artifact matching its path aliases.",
    "Use partial/missing rows to prioritize future manual or browser QA."
  ],
  evidenceByPath
};

fs.mkdirSync(path.dirname(path.join(repoRoot, outputPath)), { recursive: true });
fs.writeFileSync(path.join(repoRoot, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Covered: ${report.coveredCount}/${report.targetCount}`);
console.log(`Partial: ${report.partialCount}`);
console.log(`Missing: ${report.missingCount}`);
for (const item of evidenceByPath.filter((entry) => entry.status !== "covered")) {
  console.log(`${item.status}: ${item.targetPath || "/"} (${item.evidenceCount} artifacts)`);
}
