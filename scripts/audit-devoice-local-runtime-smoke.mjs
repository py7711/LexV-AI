import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";

const repoRoot = process.cwd();
const baseUrl = process.argv[2] ?? "http://127.0.0.1:3006";
const routeAuditPath = process.argv[3] ?? "docs/research/devoice.io/route-coverage-audit-20260701-current.json";
const outputPath = process.argv[4] ?? "docs/research/devoice.io/local-runtime-smoke-audit-20260701.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractFirst(regex, html) {
  const match = html.match(regex);
  return match ? decodeHtml(stripTags(match[1] ?? "")) : null;
}

function buttonTexts(html) {
  return [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)]
    .map((match) => decodeHtml(stripTags(match[1] ?? "")))
    .filter(Boolean)
    .slice(0, 12);
}

function linkTexts(html) {
  return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => decodeHtml(stripTags(match[1] ?? "")))
    .filter(Boolean)
    .slice(0, 12);
}

function pathToUrl(targetPath) {
  const suffix = targetPath ? `/en/${targetPath}` : "/en";
  return `${baseUrl.replace(/\/+$/, "")}${suffix}`;
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    const request = client.request(
      parsedUrl,
      {
        method: "GET",
        headers: {
          "User-Agent": "DeVoice local runtime smoke audit"
        },
        timeout: 20000
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Request timed out after 20000ms: ${url}`));
    });
    request.on("error", reject);
    request.end();
  });
}

const routeAudit = readJson(routeAuditPath);
const targetPaths = routeAudit.targetPaths;
const results = [];

for (const targetPath of targetPaths) {
  const url = pathToUrl(targetPath);
  const startedAt = Date.now();
  try {
    const response = await requestText(url);
    const html = response.body;
    const title = extractFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
    const h1 = extractFirst(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i, html);
    const bodyText = decodeHtml(stripTags(html)).slice(0, 1200);
    const hasNotFound = response.status === 404 || /404|This page could not be found|not found/i.test(title ?? "");
    const hasServerError = response.status >= 500 || /Internal Server Error|Application error/i.test(bodyText);
    const hasHydrationPayload = html.includes("__next") || html.includes("self.__next_f");
    const actions = buttonTexts(html);
    const links = linkTexts(html);

    results.push({
      targetPath,
      url,
      status: response.status,
      redirected: response.status >= 300 && response.status < 400,
      location: response.headers.location ?? null,
      elapsedMs: Date.now() - startedAt,
      title,
      h1,
      actionCount: actions.length,
      actions,
      linkCount: links.length,
      links,
      hasNotFound,
      hasServerError,
      hasHydrationPayload,
      ok: response.status >= 200 && response.status < 400 && !hasNotFound && !hasServerError && Boolean(title) && Boolean(h1)
    });
  } catch (error) {
    results.push({
      targetPath,
      url,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      ok: false
    });
  }
}

const failed = results.filter((item) => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  routeAuditPath,
  targetCount: targetPaths.length,
  okCount: results.length - failed.length,
  failedCount: failed.length,
  notes: [
    "This audit fetches the local English route for every target sitemap path and checks for renderable HTML, title, H1, and absence of obvious 404/500 pages.",
    "It is a runtime smoke gate, not a browser visual parity or interaction-completeness proof.",
    "Browser-based route audits should still be used for layout overflow, responsive behavior, and click-driven interactions."
  ],
  failed,
  results
};

fs.mkdirSync(path.dirname(path.join(repoRoot, outputPath)), { recursive: true });
fs.writeFileSync(path.join(repoRoot, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Runtime smoke OK: ${report.okCount}/${report.targetCount}`);
if (failed.length) {
  for (const item of failed) {
    console.log(`FAIL ${item.targetPath || "/"} status=${item.status ?? "error"} title=${item.title ?? item.error ?? ""}`);
  }
  process.exitCode = 1;
}
