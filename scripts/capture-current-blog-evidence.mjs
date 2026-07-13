import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = process.cwd();
const screenshotsDir = path.join(repoRoot, "docs/design-references/devoice.io");
const researchDir = path.join(repoRoot, "docs/research/devoice.io");
const chromePath =
  process.env.CHROME_EXECUTABLE_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const require = createRequire(import.meta.url);

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

const routes = [
  "blog/remove-background-music-from-audio",
  "blog/how-to-extract-audio-from-video",
  "blog/remove-background-noise-and-background-conversation"
];

fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(researchDir, { recursive: true });

function routeSlug(route) {
  return route.replaceAll("/", "-");
}

function screenshotName(route) {
  return `local-${routeSlug(route)}-current-1440-20260701.png`;
}

function metricsName(route) {
  return `local-${routeSlug(route)}-current-1440-20260701.json`;
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    const url = `http://127.0.0.1:3006/en/${route}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(1_000);

    const screenshot = screenshotName(route);
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
          display: cs.display,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          paddingTop: cs.paddingTop,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight
        };
      }

      const article = document.querySelector("article");
      const heroImg = document.querySelector(".blogPostHero img");
      const shell = document.querySelector(".devoiceShell");
      const promo = document.querySelector(".devoicePromoBar, .promoBar, [data-testid='promo-bar']");
      const bodyText = [
        ...document.querySelectorAll(".policyDocument p, .policyDocument h2, .policyDocument h3")
      ]
        .slice(0, 8)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent.trim().slice(0, 120),
            rect: { x: r.x, y: r.y, width: r.width, height: r.height }
          };
        });

      return {
        url: location.href,
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        scrollHeight: document.documentElement.scrollHeight,
        shellClass: shell?.className?.toString() ?? null,
        articleClass: article?.className?.toString() ?? null,
        promoRect: promo
          ? (() => {
              const r = promo.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            })()
          : null,
        h1: rect("h1"),
        article: rect("article"),
        hero: rect(".blogPostHero"),
        heroImg: rect(".blogPostHero img"),
        heroImage: heroImg
          ? {
              src: heroImg.getAttribute("src"),
              naturalWidth: heroImg.naturalWidth,
              naturalHeight: heroImg.naturalHeight,
              complete: heroImg.complete
            }
          : null,
        policyDocument: rect(".policyDocument"),
        bodyText
      };
    });

    const metricsFile = metricsName(route);
    const metricsPayload = {
      screenshot: `docs/design-references/devoice.io/${screenshot}`,
      ...metrics
    };
    fs.writeFileSync(
      path.join(researchDir, metricsFile),
      `${JSON.stringify(metricsPayload, null, 2)}\n`
    );

    results.push({
      route,
      screenshot,
      metrics: metricsFile,
      h1: metrics.h1,
      heroImg: metrics.heroImg,
      heroImage: metrics.heroImage,
      promoRect: metrics.promoRect,
      scrollHeight: metrics.scrollHeight
    });
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
