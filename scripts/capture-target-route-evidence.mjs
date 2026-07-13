import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = process.cwd();
const screenshotsDir = path.join(repoRoot, "docs/design-references/devoice.io");
const researchDir = path.join(repoRoot, "docs/research/devoice.io");
const chromePath =
  process.env.CHROME_EXECUTABLE_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const require = createRequire(import.meta.url);

const todayStamp = process.env.DEVOICE_CAPTURE_DATE ?? "20260702";
const args = process.argv.slice(2);
const viewportArg = args.find((arg) => arg.startsWith("--viewport="));
const baseUrlArg = args.find((arg) => arg.startsWith("--base-url="));
const localeArg = args.find((arg) => arg.startsWith("--locale="));
const modeArg = args.find((arg) => arg.startsWith("--mode="));
const fullPage = args.includes("--full-page");
const keepOverlays = args.includes("--keep-overlays");
const routeArgs = args.filter((arg) => !arg.startsWith("--"));
const routes = routeArgs.length ? routeArgs : ["pricing"];
const viewportMatch = viewportArg?.match(/^--viewport=(\d+)x(\d+)$/);
const viewport = viewportMatch
  ? { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) }
  : { width: 1280, height: 720 };
const baseUrl = (baseUrlArg?.slice("--base-url=".length) || "https://devoice.io").replace(/\/+$/, "");
const localePrefix = localeArg?.slice("--locale=".length).replace(/^\/+|\/+$/g, "") ?? "";
const captureMode = modeArg?.slice("--mode=".length) || (keepOverlays ? "raw" : "clean");

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

function viewportLabel(size) {
  if (size.width <= 500) return "mobile";
  if (size.width >= 1000) return "desktop";
  return "tablet";
}

function targetUrl(route) {
  const clean = route.replace(/^\/+/, "");
  if (!clean) return localePrefix ? `${baseUrl}/${localePrefix}` : baseUrl;
  if (!localePrefix || clean.startsWith(`${localePrefix}/`)) return `${baseUrl}/${clean}`;
  return `${baseUrl}/${localePrefix}/${clean}`;
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    function rect(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: Number(r.x.toFixed(2)),
        y: Number(r.y.toFixed(2)),
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
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

    function visible(selector) {
      return [...document.querySelectorAll(selector)].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          className: el.className?.toString() ?? "",
          text: el.textContent?.trim().replace(/\s+/g, " ").slice(0, 180) ?? "",
          rect: {
            x: Number(r.x.toFixed(2)),
            y: Number(r.y.toFixed(2)),
            width: Number(r.width.toFixed(2)),
            height: Number(r.height.toFixed(2))
          },
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity
        };
      });
    }

    const overlaySelectors = [
      ".promoBar",
      ".rewardPopup",
      ".modalOverlay",
      "[role='dialog']",
      "[class*='promo' i]",
      "[class*='reward' i]",
      "[class*='modal' i]",
      "[class*='popup' i]",
      "[class*='overlay' i]"
    ].join(",");

    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { x: scrollX, y: scrollY },
      scrollHeight: document.documentElement.scrollHeight,
      bodyClass: document.body.className?.toString() ?? "",
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      h1: rect("h1"),
      sidebar: rect("aside, .devoiceSidebar, [class*='sidebar' i]"),
      promoBar: rect(".promoBar, [class*='promo' i]"),
      rewardPopup: rect(".rewardPopup, [class*='reward' i], [role='dialog']"),
      uploadPanel: rect(".uploadPanel, [class*='upload' i], form"),
      primaryPanel: rect(".toolPanel, .voicePanel, .promptPanel, main form, article"),
      overlays: visible(overlaySelectors).filter((item) => item.rect.width > 0 && item.rect.height > 0),
      textStart: document.body.innerText.slice(0, 1800)
    };
  });
}

async function prepareAnonymousPage(page) {
  await page.addInitScript(() => {
    const now = new Date().toISOString().slice(0, 10);
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("lastBannerShowDate", now);
      localStorage.setItem("devoiceCheckInDismissedDate", now);
      localStorage.setItem("dailyRewardDismissedDate", now);
      localStorage.setItem("dailyCheckInDismissedDate", now);
    } catch {
      // Ignore storage restrictions on third-party or hardened contexts.
    }
  });
}

async function cleanupTransientUi(page) {
  await page.evaluate(() => {
    const selectors = [
      ".rewardPopup",
      ".modalOverlay",
      "[role='dialog']",
      "[class*='reward' i]",
      "[class*='modal' i]",
      "[class*='popup' i]",
      "[class*='overlay' i]"
    ];

    const candidates = new Set([
      ...selectors.flatMap((selector) => [...document.querySelectorAll(selector)]),
      ...document.querySelectorAll("body *")
    ]);

    for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const text = el.textContent?.toLowerCase() ?? "";
        const className = el.className?.toString().toLowerCase() ?? "";
        const zIndex = Number.parseInt(cs.zIndex, 10);
        const likelyTransient =
          rect.width >= 80 &&
          rect.height >= 20 &&
          (className.includes("reward") ||
            className.includes("modal") ||
            className.includes("popup") ||
            className.includes("overlay") ||
            ((cs.position === "fixed" || cs.position === "sticky") &&
              Number.isFinite(zIndex) &&
              zIndex >= 100 &&
              (text.includes("daily") ||
                text.includes("credit") ||
                text.includes("claim your") ||
                text.includes("today's reward"))));
        if (likelyTransient) {
          el.setAttribute("data-devoice-capture-hidden", "true");
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
        }
    }
  });
}

fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(researchDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

try {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC"
  });
  const page = await context.newPage();
  await prepareAnonymousPage(page);

  const results = [];
  for (const route of routes) {
    const slug = routeSlug(route);
    const label = viewportLabel(viewport);
    const url = targetUrl(route);
    const response = await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1_500);
    const beforeCleanup = await collectMetrics(page);

    if (!keepOverlays) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await cleanupTransientUi(page);
        await page.waitForTimeout(250);
      }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const afterCleanup = await collectMetrics(page);

    const screenshot = `target-${slug}-${label}-${captureMode}-${viewport.width}-${todayStamp}.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, screenshot),
      fullPage
    });

    const metricsFile = `target-${slug}-${label}-${captureMode}-${viewport.width}-${todayStamp}.json`;
    fs.writeFileSync(
      path.join(researchDir, metricsFile),
      `${JSON.stringify(
        {
          route,
          requestedUrl: url,
          screenshot: `docs/design-references/devoice.io/${screenshot}`,
          capture: {
            side: "target",
            mode: captureMode,
            fullPage,
            keepOverlays,
            responseStatus: response?.status() ?? null,
            viewport,
            generatedAt: new Date().toISOString()
          },
          beforeCleanup,
          afterCleanup
        },
        null,
        2
      )}\n`
    );

    results.push({
      route,
      screenshot,
      metrics: metricsFile,
      finalUrl: afterCleanup.url,
      responseStatus: response?.status() ?? null,
      beforeOverlayCount: beforeCleanup.overlays.length,
      afterOverlayCount: afterCleanup.overlays.length,
      h1: afterCleanup.h1,
      scrollHeight: afterCleanup.scrollHeight
    });
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
