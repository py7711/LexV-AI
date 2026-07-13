import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const repoRoot = process.cwd();
const targetSitemapPath = process.argv[2] ?? "/tmp/devoice-sitemap.xml";
const outputPath = process.argv[3] ?? path.join(repoRoot, "docs/research/devoice.io/route-coverage-audit-20260701-current.json");

const locales = [
  "en",
  "it",
  "es",
  "de",
  "fr",
  "pt",
  "br",
  "vi",
  "ru",
  "id",
  "ja",
  "hi",
  "ar",
  "bn",
  "ur",
  "zh-cn",
  "zh-tw"
];

const ignoredLocalRoutes = new Set([
  "dashboard",
  "jobs/[jobId]",
  "reset-password"
]);

function readSource(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return ts.createSourceFile(relativePath, fs.readFileSync(absolutePath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function arrayStringsFromVariable(sourceFile, variableName) {
  const values = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
          values.push(normalizePath(element.text));
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function objectKeysFromVariable(sourceFile, variableName) {
  const values = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          continue;
        }
        const key = property.name;
        if (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key) || ts.isIdentifier(key)) {
          values.push(normalizePath(key.text));
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function blogSlugsFromStaticPageSource(sourceFile) {
  const slugs = [];

  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "slug" &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      slugs.push(normalizePath(`blog/${node.initializer.text}`));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return slugs;
}

function normalizePath(value) {
  let normalized = value.trim();
  normalized = normalized.replace(/^https?:\/\/devoice\.io/i, "");
  normalized = normalized.replace(/^https?:\/\/www\.devoice\.io/i, "");
  normalized = normalized.split(/[?#]/, 1)[0] ?? "";
  normalized = normalized.replace(/^\/+|\/+$/g, "");

  const firstSegment = normalized.split("/", 1)[0];
  if (locales.includes(firstSegment)) {
    normalized = normalized.slice(firstSegment.length).replace(/^\/+|\/+$/g, "");
  }

  return normalized;
}

function uniqueSorted(values) {
  return [...new Set(values.map(normalizePath))].filter((value) => value || value === "").sort((a, b) => a.localeCompare(b));
}

function parseTargetSitemap(xmlPath) {
  const xml = fs.readFileSync(xmlPath, "utf8");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  return uniqueSorted(urls.map(normalizePath));
}

function discoverConcreteAppRoutes() {
  const appLocaleRoot = path.join(repoRoot, "app/[locale]");
  const routes = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (entry.name !== "page.tsx") {
        continue;
      }
      const relativeDir = path.relative(appLocaleRoot, path.dirname(absolute));
      const route = normalizePath(relativeDir === "" ? "" : relativeDir);
      if (!route.includes("[") && !ignoredLocalRoutes.has(route)) {
        routes.push(route);
      }
    }
  }

  walk(appLocaleRoot);
  return uniqueSorted(routes);
}

const sitemapSource = readSource("app/sitemap.ts");
const toolPageSource = readSource("components/devoice-tool-page.tsx");
const staticPageSource = readSource("components/devoice-static-page.tsx");

const targetPaths = parseTargetSitemap(targetSitemapPath);
const localSitemapPaths = uniqueSorted(arrayStringsFromVariable(sitemapSource, "sitemapPaths"));
const localToolConfigPaths = uniqueSorted(objectKeysFromVariable(toolPageSource, "toolConfigs").filter((item) => item !== "home"));
const localStaticConfigPaths = uniqueSorted(objectKeysFromVariable(staticPageSource, "staticPageConfigs"));
const localBlogPostPaths = uniqueSorted(blogSlugsFromStaticPageSource(staticPageSource));
const localConcreteAppPaths = discoverConcreteAppRoutes();
const localConfigPaths = uniqueSorted([...localToolConfigPaths, ...localStaticConfigPaths, ...localBlogPostPaths]);
const localComparablePaths = uniqueSorted([...localSitemapPaths, ...localConfigPaths, ...localConcreteAppPaths, ""]);

const targetMissingLocal = targetPaths.filter((item) => !localComparablePaths.includes(item));
const localMissingTarget = localComparablePaths.filter((item) => !targetPaths.includes(item));
const targetMissingLocalSitemap = targetPaths.filter((item) => !localSitemapPaths.includes(item));
const localSitemapMissingTarget = localSitemapPaths.filter((item) => !targetPaths.includes(item));

const report = {
  capturedAt: new Date().toISOString(),
  targetSitemapPath,
  targetCount: targetPaths.length,
  localComparableCount: localComparablePaths.length,
  localSitemapCount: localSitemapPaths.length,
  targetPaths,
  localComparablePaths,
  localSitemapPaths,
  localConfigPaths,
  localToolConfigPaths,
  localStaticConfigPaths,
  localBlogPostPaths,
  localConcreteAppPaths,
  ignoredLocalRoutes: [...ignoredLocalRoutes].sort(),
  targetMissingLocal,
  localMissingTarget,
  targetMissingLocalSitemap,
  localSitemapMissingTarget,
  notes: [
    "targetMissingLocal/localMissingTarget compare target sitemap paths to concrete implemented local paths.",
    "targetMissingLocalSitemap/localSitemapMissingTarget compare target sitemap paths to app/sitemap.ts only.",
    "Authenticated or parameterized local-only routes are intentionally excluded from localComparablePaths unless target sitemap lists them."
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`Target paths: ${report.targetCount}`);
console.log(`Local comparable paths: ${report.localComparableCount}`);
console.log(`Missing locally: ${targetMissingLocal.length ? targetMissingLocal.join(", ") : "none"}`);
console.log(`Local-only comparable paths: ${localMissingTarget.length ? localMissingTarget.join(", ") : "none"}`);
