import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const defaultPairs = [
  {
    name: "text-to-speech-desktop",
    target: "docs/design-references/devoice.io/target-tts-desktop.png",
    local: "docs/design-references/devoice.io/local-tts-desktop-post-css.png"
  },
  {
    name: "ai-voice-cloning-desktop",
    target: "docs/design-references/devoice.io/target-clone-desktop.png",
    local: "docs/design-references/devoice.io/local-clone-desktop-post-css.png"
  },
  {
    name: "text-to-speech-mobile",
    target: "docs/design-references/devoice.io/target-mobile-tts.png",
    local: "docs/design-references/devoice.io/local-mobile-tts.png"
  },
  {
    name: "ai-voice-cloning-mobile",
    target: "docs/design-references/devoice.io/target-mobile-voice-cloning.png",
    local: "docs/design-references/devoice.io/local-mobile-voice-cloning.png"
  },
  {
    name: "text-to-speech-api-demo-desktop",
    target: "docs/design-references/devoice.io/target-demo-text-to-speech-desktop-20260630.png",
    local: "docs/design-references/devoice.io/local-demo-text-to-speech-final-desktop-20260630.png"
  }
];

const outputDir = process.argv[2] ?? "docs/design-references/devoice.io/diffs";
const reportPath = process.argv[3] ?? "docs/research/devoice.io/visual-diff-priority-20260630.json";
const pairsPath = process.argv[4];

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

async function loadRawImage(relativePath) {
  const image = sharp(absolute(relativePath)).ensureAlpha();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    throw new Error(`Unable to read dimensions for ${relativePath}`);
  }

  const data = await image.raw().toBuffer();
  return { data, width, height };
}

async function loadRawImageResized(relativePath, width, height) {
  const data = await sharp(absolute(relativePath))
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  return { data, width, height };
}

function pixelAt(image, x, y, channel) {
  return image.data[(y * image.width + x) * 4 + channel] ?? 0;
}

async function compareImages({ name, target, local, mode, width, height }) {
  const pixelCount = width * height;
  const diff = Buffer.alloc(pixelCount * 4);
  let mismatchedPixels = 0;
  let totalAbsoluteError = 0;
  let totalSquaredError = 0;
  let maxChannelDelta = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const outIndex = (y * width + x) * 4;
      let pixelDelta = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(pixelAt(target, x, y, channel) - pixelAt(local, x, y, channel));
        pixelDelta += delta;
        totalAbsoluteError += delta;
        totalSquaredError += delta * delta;
        maxChannelDelta = Math.max(maxChannelDelta, delta);
      }

      if (pixelDelta > 24) {
        mismatchedPixels += 1;
        diff[outIndex] = 255;
        diff[outIndex + 1] = Math.max(0, 80 - pixelDelta / 8);
        diff[outIndex + 2] = Math.max(0, 80 - pixelDelta / 8);
        diff[outIndex + 3] = 255;
      } else {
        const gray = Math.max(0, 26 - pixelDelta / 8);
        diff[outIndex] = gray;
        diff[outIndex + 1] = gray;
        diff[outIndex + 2] = gray;
        diff[outIndex + 3] = 255;
      }
    }
  }

  fs.mkdirSync(absolute(outputDir), { recursive: true });
  const diffPath = path.join(outputDir, `${name}.${mode}.diff.png`);
  await sharp(diff, { raw: { width, height, channels: 4 } }).png().toFile(absolute(diffPath));

  const comparedChannels = pixelCount * 3;
  return {
    mode,
    diff: diffPath,
    comparedSize: { width, height },
    mismatchedPixels,
    mismatchRatio: Number((mismatchedPixels / pixelCount).toFixed(6)),
    meanAbsoluteError: Number((totalAbsoluteError / comparedChannels).toFixed(3)),
    rootMeanSquaredError: Number(Math.sqrt(totalSquaredError / comparedChannels).toFixed(3)),
    maxChannelDelta
  };
}

async function diffPair(pair) {
  const target = await loadRawImage(pair.target);
  const local = await loadRawImage(pair.local);
  const cropWidth = Math.min(target.width, local.width);
  const cropHeight = Math.min(target.height, local.height);
  const localScaledToTarget = await loadRawImageResized(pair.local, target.width, target.height);
  const preferredComparison = target.width === local.width && target.height !== local.height ? "crop" : "scaled";
  const comparisons = [
    await compareImages({
      name: pair.name,
      target,
      local,
      mode: "crop",
      width: cropWidth,
      height: cropHeight
    }),
    await compareImages({
      name: pair.name,
      target,
      local: localScaledToTarget,
      mode: "scaled",
      width: target.width,
      height: target.height
    })
  ];

  return {
    name: pair.name,
    target: pair.target,
    local: pair.local,
    targetSize: { width: target.width, height: target.height },
    localSize: { width: local.width, height: local.height },
    comparisons,
    preferredComparison,
    mismatchRatio: comparisons.find((item) => item.mode === preferredComparison)?.mismatchRatio ?? comparisons[0]?.mismatchRatio,
    meanAbsoluteError: comparisons.find((item) => item.mode === preferredComparison)?.meanAbsoluteError ?? comparisons[0]?.meanAbsoluteError,
    rootMeanSquaredError: comparisons.find((item) => item.mode === preferredComparison)?.rootMeanSquaredError ?? comparisons[0]?.rootMeanSquaredError,
    diff: comparisons.find((item) => item.mode === preferredComparison)?.diff ?? comparisons[0]?.diff
  };
}

const results = [];
const pairs = pairsPath ? JSON.parse(fs.readFileSync(absolute(pairsPath), "utf8")) : defaultPairs;
for (const pair of pairs) {
  try {
    results.push(await diffPair(pair));
  } catch (error) {
    results.push({
      name: pair.name,
      target: pair.target,
      local: pair.local,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const sortedCompleted = results
  .filter((item) => !("error" in item))
  .toSorted((a, b) => b.mismatchRatio - a.mismatchRatio);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: [
    "Each image pair is compared two ways: crop mode compares the shared top-left dimensions; scaled mode resizes the local screenshot to the target screenshot dimensions.",
    "The preferred ranking uses scaled mode to reduce noise from different capture sizes, except when screenshots have the same width and different heights; those pairs use crop mode to avoid stretching a matching-width viewport vertically.",
    "A pixel counts as mismatched when the RGB absolute delta sum is greater than 24.",
    "This is an audit aid for prioritizing visual work, not a pass/fail gate until stable thresholds are agreed."
  ],
  outputDir,
  pairs: results,
  highestMismatchFirst: sortedCompleted.map((item) => ({
    name: item.name,
    mismatchRatio: item.mismatchRatio,
    meanAbsoluteError: item.meanAbsoluteError,
    rootMeanSquaredError: item.rootMeanSquaredError,
    preferredComparison: item.preferredComparison,
    diff: item.diff
  }))
};

fs.mkdirSync(path.dirname(absolute(reportPath)), { recursive: true });
fs.writeFileSync(absolute(reportPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Wrote ${reportPath}`);
for (const item of report.highestMismatchFirst) {
  console.log(`${item.name}: ${item.preferredComparison} mismatch=${item.mismatchRatio} mae=${item.meanAbsoluteError} rmse=${item.rootMeanSquaredError}`);
}
