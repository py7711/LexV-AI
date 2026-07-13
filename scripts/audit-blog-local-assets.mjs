import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, "components/devoice-static-page.tsx");
const outputPath = path.join(repoRoot, "docs/research/devoice.io/blog-local-assets-audit-20260701.json");

const source = fs.readFileSync(sourcePath, "utf8");
const imageMatches = [...source.matchAll(/image:\s*"([^"]+)"/g)].map((match) => match[1]);
const blogImages = imageMatches.filter((image) => image.startsWith("/assets/blog/"));

const rows = [];
for (const image of blogImages) {
  const relativePath = image.replace(/^\//, "");
  const absolutePath = path.join(repoRoot, "public", relativePath.replace(/^assets\//, "assets/"));
  const exists = fs.existsSync(absolutePath);
  let metadata = null;
  let error = null;

  if (exists) {
    try {
      const info = await sharp(absolutePath).metadata();
      metadata = {
        width: info.width ?? null,
        height: info.height ?? null,
        format: info.format ?? null
      };
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }
  }

  rows.push({
    image,
    file: path.relative(repoRoot, absolutePath),
    exists,
    metadata,
    validImage: Boolean(exists && metadata?.width && metadata?.height),
    error
  });
}

const missingOrInvalid = rows.filter((row) => !row.validImage);
const report = {
  generatedAt: new Date().toISOString(),
  sourcePath: path.relative(repoRoot, sourcePath),
  summary: {
    blogImageCount: rows.length,
    validImageCount: rows.filter((row) => row.validImage).length,
    missingOrInvalidCount: missingOrInvalid.length
  },
  rows,
  missingOrInvalid
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(
  [
    `blogImages=${report.summary.blogImageCount}`,
    `valid=${report.summary.validImageCount}`,
    `missingOrInvalid=${report.summary.missingOrInvalidCount}`
  ].join(" ")
);

if (missingOrInvalid.length > 0) {
  process.exitCode = 1;
}
