import assert from "node:assert/strict";
import {
  createLocalMediaDownloadUrl,
  createLocalMediaStorageKey,
  getLocalMediaObject,
  isLocalMediaStorageKey,
  parseLocalMediaToken,
  putLocalMediaObject
} from "@/lib/local-media-store";
import { shouldCompleteTranscriptionInline } from "@/lib/devoice-transcription-processing";

async function main() {
  process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  process.env.DEVOICE_LOCAL_MEDIA_DIR = process.env.DEVOICE_LOCAL_MEDIA_DIR || ".devoice-local-media-test";
  process.env.DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "test-deepgram";

  const storageKey = createLocalMediaStorageKey({
    workspaceId: "test-workspace",
    fileName: "sample voice.mp3",
    mediaKind: "source"
  });
  assert.equal(isLocalMediaStorageKey(storageKey), true);

  const bytes = new TextEncoder().encode("fake audio bytes");
  const written = await putLocalMediaObject({ storageKey, body: bytes });
  assert.equal(written.byteSize, bytes.byteLength);

  const loaded = await getLocalMediaObject({ storageKey });
  assert.deepEqual([...loaded.body], [...bytes]);

  const url = createLocalMediaDownloadUrl(storageKey);
  const token = url.split("/").pop();
  assert.ok(token);
  assert.equal(parseLocalMediaToken(token), storageKey);

  assert.equal(
    shouldCompleteTranscriptionInline({
      sourceType: "speech_to_text",
      storageKey
    }),
    true
  );

  assert.equal(
    shouldCompleteTranscriptionInline({
      sourceType: "speech_to_text",
      sourceUrl: "https://example.com/audio.mp3"
    }),
    false
  );

  console.log("local media flow ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
