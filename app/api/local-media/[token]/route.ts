import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocalMediaObject, parseLocalMediaToken, putLocalMediaObject } from "@/lib/local-media-store";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function contentTypeOf(storageKey: string) {
  const lower = storageKey.toLowerCase();
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}

async function requireSignedInUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice before uploading files." }, { status: 401 });
  }

  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  const authError = await requireSignedInUser();
  if (authError) return authError;

  const { token } = await context.params;
  const storageKey = parseLocalMediaToken(token);
  if (!storageKey) {
    return NextResponse.json({ error: "Invalid local media upload URL." }, { status: 400 });
  }

  const maxBytes = Number(process.env.DEVOICE_LOCAL_MEDIA_MAX_BYTES ?? 1024 * 1024 * 1024);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    return NextResponse.json({ error: "File is too large for local DeVoice media storage." }, { status: 413 });
  }

  const object = await putLocalMediaObject({ storageKey, body: bytes });
  return NextResponse.json({ ok: true, storageKey, byteSize: object.byteSize, etag: object.etag });
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const storageKey = parseLocalMediaToken(token);
  if (!storageKey) {
    return NextResponse.json({ error: "Invalid local media URL." }, { status: 400 });
  }

  try {
    const object = await getLocalMediaObject({ storageKey });
    const copy = new ArrayBuffer(object.body.byteLength);
    new Uint8Array(copy).set(object.body);
    return new NextResponse(copy, {
      headers: {
        "Content-Type": contentTypeOf(storageKey),
        "Content-Length": String(object.byteSize),
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Local media file does not exist." },
      { status: 404 }
    );
  }
}
