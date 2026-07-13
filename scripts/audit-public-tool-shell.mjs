import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const shellPath = path.join(repoRoot, "components/devoice-shell.tsx");
const outputPath = path.join(repoRoot, "docs/research/devoice.io/public-shell-audit-20260701.json");

const source = fs.readFileSync(shellPath, "utf8");

function extractStringArray(patternName, regex) {
  const match = source.match(regex);
  if (!match) {
    return {
      name: patternName,
      found: false,
      values: []
    };
  }

  return {
    name: patternName,
    found: true,
    values: [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  };
}

const publicToolPaths = extractStringArray(
  "publicToolShellPaths",
  /const publicToolShellPaths = new Set\(\[\s*([\s\S]*?)\s*\]\);/
);

const autoCollapsedToolPaths = extractStringArray(
  "autoCollapsedToolShellPaths",
  /const autoCollapsedToolShellPaths = new Set\(\[\s*([\s\S]*?)\s*\]\);/
);

const transcriberPaths = extractStringArray(
  "aiTranscriberActive",
  /const aiTranscriberActive = \[([\s\S]*?)\]\.some/
);

const voicesPaths = extractStringArray(
  "aiVoicesActive",
  /const aiVoicesActive = \[([\s\S]*?)\]\.some/
);

const youtubePaths = extractStringArray(
  "aiYoutubeActive",
  /const aiYoutubeActive = \[([\s\S]*?)\]\.some/
);

const requiredContentRailRoutes = ["blog", "blog/", "privacy-policy", "refund-policy", "terms-of-use"];
const requiredAutoCollapsedToolRoutes = [
  "ai-dubbing",
  "ai-voice-changer",
  "ai-voice-enhancer-isolate",
  "ai-music-generator",
  "ai-rap-generator",
  "ai-rap-lyrics-generator",
  "transcribe-youtube-videos"
];
const hasContentRailHelper = /function usesPublicContentRail\(pathWithoutLocale: string\)/.test(source);
const contentRailIsConditional = /\{publicContentActive \? \(\s*<a className="sideNavActive publicContentRailLink"/.test(source);
const priorityVoicePageIsSeparateFromPublicShell =
  source.includes('const priorityVoicePage = pathWithoutLocale === "text-to-speech" || pathWithoutLocale === "ai-voice-cloning";') &&
  !publicToolPaths.values.includes("text-to-speech") &&
  !publicToolPaths.values.includes("ai-voice-cloning");
const collapsedShellFunctionBody =
  source.match(/function usesCollapsedPublicShell\(pathWithoutLocale: string\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
const publicToolsAreNotCollapsedShell =
  !collapsedShellFunctionBody.includes("publicToolShellPaths.has(pathWithoutLocale)");
const promoBarShownOnPriorityVoicePages =
  /const showPromoBar = [^;]*priorityVoicePage[^;]*&& promoVisible;/.test(source);
const promoBarShownOnPricingPage =
  source.includes('const pricingPage = pathWithoutLocale === "pricing";') &&
  /const showPromoBar = [^;]*pricingPage[^;]*&& promoVisible;/.test(source);
const promoBarSuppressedOnBlogPages =
  source.includes('pathWithoutLocale === "blog"') &&
  source.includes('pathWithoutLocale.startsWith("blog/")');
const promoBarSuppressedOnPublicTools =
  source.includes('publicToolShellPaths.has(pathWithoutLocale)');
const rewardPopupSuppressedOnPublicTools =
  /const suppressRewardPopup = [^;]*publicToolShellPaths\.has\(pathWithoutLocale\)[^;]*;/.test(source);
const contentRailChecks = requiredContentRailRoutes.map((route) => ({
  route,
  ok:
    route === "blog/"
      ? source.includes('pathWithoutLocale.startsWith("blog/")')
      : source.includes(`pathWithoutLocale === "${route}"`)
}));
const autoCollapsedToolChecks = requiredAutoCollapsedToolRoutes.map((route) => ({
  route,
  ok: autoCollapsedToolPaths.values.includes(route)
}));

const groupEntries = [
  ["AI Transcriber", transcriberPaths.values],
  ["AI Voices", voicesPaths.values],
  ["AI YouTube", youtubePaths.values]
];

const routeAssignments = publicToolPaths.values.map((route) => {
  const groups = groupEntries.filter(([, routes]) => routes.includes(route)).map(([group]) => group);
  return {
    route,
    groups,
    ok: groups.length === 1
  };
});

const missing = routeAssignments.filter((item) => item.groups.length === 0);
const duplicated = routeAssignments.filter((item) => item.groups.length > 1);
const extractionFailures = [publicToolPaths, autoCollapsedToolPaths, transcriberPaths, voicesPaths, youtubePaths].filter((item) => !item.found);
const cssPath = path.join(repoRoot, "app/globals.css");
const css = fs.readFileSync(cssPath, "utf8");
const priorityVoiceDescriptionMatchesTarget = [
  ".priorityVoiceToolHero .heroHeading p",
  "width: fit-content",
  "max-width: 1024px",
  "margin: 16px auto 0",
  "color: #ffffff",
  "font-size: 18px",
  "line-height: 28px"
].every((snippet) => css.includes(snippet));
const blogPostHeroGeometryMatchesTarget = [
  ".blogPostPage",
  "padding: 136px 0 80px",
  ".blogPostHero",
  "margin: 32px 0"
].every((snippet) => css.includes(snippet));
const pricingPromoOverlayMatchesTarget = [
  ".pricingShellPage",
  ".devoiceContent:has(.pricingShellPage) .promoBar",
  "position: fixed",
  "left: 248px",
  ".devoiceApp:has(.devoiceSidebar.sidebarCollapsed) .devoiceContent:has(.pricingShellPage) .promoBar",
  "left: 72px"
].every((snippet) => css.includes(snippet));

const report = {
  generatedAt: new Date().toISOString(),
  shellPath: "components/devoice-shell.tsx",
  purpose: "Static guard for current target shell contracts: content pages and selected public tool pages use the collapsed rail; priority voice pages keep the expanded app shell.",
  ok:
    extractionFailures.length === 0 &&
    missing.length === 0 &&
    duplicated.length === 0 &&
    hasContentRailHelper &&
    contentRailIsConditional &&
    publicToolsAreNotCollapsedShell &&
    priorityVoicePageIsSeparateFromPublicShell &&
    promoBarShownOnPriorityVoicePages &&
    promoBarShownOnPricingPage &&
    promoBarSuppressedOnBlogPages &&
    promoBarSuppressedOnPublicTools &&
    rewardPopupSuppressedOnPublicTools &&
    priorityVoiceDescriptionMatchesTarget &&
    blogPostHeroGeometryMatchesTarget &&
    pricingPromoOverlayMatchesTarget &&
    contentRailChecks.every((item) => item.ok) &&
    autoCollapsedToolChecks.every((item) => item.ok),
  extractionFailures,
  counts: {
    publicToolRoutes: publicToolPaths.values.length,
    autoCollapsedToolRoutes: autoCollapsedToolPaths.values.length,
    transcriberRoutes: transcriberPaths.values.length,
    voicesRoutes: voicesPaths.values.length,
    youtubeRoutes: youtubePaths.values.length,
    contentRoutes: requiredContentRailRoutes.length
  },
  autoCollapsedTools: {
    checks: autoCollapsedToolChecks,
    values: autoCollapsedToolPaths.values
  },
  contentRail: {
    helperFound: hasContentRailHelper,
    conditionalRenderFound: contentRailIsConditional,
    checks: contentRailChecks
  },
  priorityVoiceCurrentDesktopParity: {
    separateFromPublicCollapsedShell: priorityVoicePageIsSeparateFromPublicShell,
    promoBarShownOnPriorityVoicePages,
    promoBarSuppressedOnBlogPages,
    promoBarSuppressedOnPublicTools,
    descriptionStyleMatchesCurrentTarget: priorityVoiceDescriptionMatchesTarget
  },
  publicToolCurrentDesktopParity: {
    expandedAppShell: publicToolsAreNotCollapsedShell,
    selectedRoutesUseCollapsedRail: autoCollapsedToolChecks.every((item) => item.ok),
    promoBarSuppressedOnPublicTools,
    rewardPopupSuppressedOnPublicTools
  },
  pricingCurrentDesktopParity: {
    promoBarShownOnPricingPage,
    promoOverlayMatchesTarget: pricingPromoOverlayMatchesTarget
  },
  blogPostCurrentDesktopParity: {
    promoBarSuppressedOnBlogPages,
    heroGeometryMatchesTarget: blogPostHeroGeometryMatchesTarget
  },
  missing,
  duplicated,
  routeAssignments,
  notes: [
    "Latest 20260702 clean target recaptures show priority voice pages using the expanded app sidebar, while AI Dubbing, AI Voice Changer, AI Voice Enhancer Isolate, Music/Rap generator pages, and Transcribe YouTube Videos use the collapsed 72px rail.",
    "Blog and policy pages use a dedicated Content rail link instead of a tool group.",
    "Text to Speech and AI Voice Cloning keep their expanded target-style sidebar, but share the current target promo bar and priority voice description typography.",
    "Pricing keeps its expanded app sidebar and overlays the promo bar without moving the target title geometry.",
    "Blog post pages suppress the promo bar and keep current target article title/hero vertical geometry.",
    "Public tool pages suppress automatic promo and reward overlays so clean viewport evidence compares the tool surface rather than transient offer UI.",
    "This is a source contract audit, not browser visual proof."
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(`public tool shell audit: ${report.ok ? "PASS" : "FAIL"}`);

if (!report.ok) {
  process.exitCode = 1;
}
