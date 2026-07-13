import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const assets = [
  {
    url: "https://cdn.devoice.io/ai_devoice/nuxt_img/ai-voice-changer/feature1.webp",
    fileName: "feature1.webp"
  },
  {
    url: "https://cdn.devoice.io/ai_devoice/nuxt_img/ai-voice-changer/feature2.webp",
    fileName: "feature2.webp"
  },
  {
    url: "https://cdn.devoice.io/ai_devoice/nuxt_img/ai-voice-changer/feature3.webp",
    fileName: "feature3.webp"
  },
  {
    url: "https://cdn.devoice.io/ai_devoice/nuxt_img/ai-voice-changer/feature4.webp",
    fileName: "feature4.webp"
  }
];

const outputDir = join(process.cwd(), "public", "assets", "ai-voice-changer");
await mkdir(outputDir, { recursive: true });

for (const { url, fileName } of assets) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const filePath = join(outputDir, fileName);
  await writeFile(filePath, bytes);
  console.log(`${filePath} ${bytes.length}`);
}
