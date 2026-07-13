import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = process.cwd();
const screenshotsDir = path.join(repoRoot, "docs/design-references/devoice.io");
const researchDir = path.join(repoRoot, "docs/research/devoice.io");
const chromePath =
  process.env.CHROME_EXECUTABLE_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const require = createRequire(import.meta.url);

const defaultRoutes = ["pricing"];
const args = process.argv.slice(2);
const viewportArg = args.find((arg) => arg.startsWith("--viewport="));
const routeArgs = args.filter((arg) => !arg.startsWith("--"));
const routes = routeArgs.length ? routeArgs : defaultRoutes;
const viewportMatch = viewportArg?.match(/^--viewport=(\d+)x(\d+)$/);
const viewport = viewportMatch
  ? { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) }
  : { width: 1280, height: 720 };

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (projectError) {
    const bundledNodeModules =
      process.env.CODEX_BUNDLED_NODE_MODULES ??
      "/Users/gxx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
    if (fs.existsSync(path.join(bundledNodeModules, "playwright/package.json"))) {
      return createRequire(path.join(bundledNodeModules, "playwright/package.json"))("playwright");
    }
    throw projectError;
  }
}

function routeSlug(route) {
  return route.replace(/^\/+/, "").replaceAll("/", "-") || "home";
}

function localizedUrl(route) {
  const clean = route.replace(/^\/+/, "");
  if (!clean) return "http://127.0.0.1:3006/en";
  if (clean.startsWith("en/")) return `http://127.0.0.1:3006/${clean}`;
  return `http://127.0.0.1:3006/en/${clean}`;
}

fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(researchDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const today = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem("sidebar_checkin_auto_popup_dismissed_date", today);
    window.localStorage.setItem("lastBannerShowDate", today);
  });
  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    const slug = routeSlug(route);
    const url = localizedUrl(route);
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1_500);

    const screenshot = `local-${slug}-current-${viewport.width}-20260702.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, screenshot),
      fullPage: false
    });

    const metrics = await page.evaluate(() => {
      function rect(selector) {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          border: cs.border,
          borderRadius: cs.borderRadius,
          boxShadow: cs.boxShadow,
          display: cs.display,
          margin: cs.margin,
          padding: cs.padding
        };
      }

      return {
        url: location.href,
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        scrollHeight: document.documentElement.scrollHeight,
        h1: rect("h1"),
        promoBar: rect(".promoBar"),
        rewardPopup: rect(".rewardPopup"),
        pricingTabs: rect(".pricingTabs"),
        firstPricingCard: rect(".pricingPackage"),
        secondPricingCard: rect(".pricingPackage:nth-of-type(2)"),
        pricingGrid: rect(".pricingPackageGrid"),
        textStart: document.body.innerText.slice(0, 1600)
      };
    });

    const metricsFile = `local-${slug}-current-${viewport.width}-20260702.json`;
    fs.writeFileSync(
      path.join(researchDir, metricsFile),
      `${JSON.stringify({ screenshot: `docs/design-references/devoice.io/${screenshot}`, ...metrics }, null, 2)}\n`
    );

    results.push({
      route,
      screenshot,
      metrics: metricsFile,
      h1: metrics.h1,
      promoBar: metrics.promoBar,
      rewardPopup: metrics.rewardPopup,
      firstPricingCard: metrics.firstPricingCard,
      secondPricingCard: metrics.secondPricingCard
    });
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
