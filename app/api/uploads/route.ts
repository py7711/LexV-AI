import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createLocalMediaStorageKey, createLocalMediaUploadUrl } from "@/lib/local-media-store";
import { createUploadUrl, hasR2Config } from "@/lib/r2";
import { resolveWritableWorkspace } from "@/lib/workspace";

const uploadSchema = z.object({
  fileName: z.string().min(1).max(160),
  contentType: z.string().min(3).max(120),
  mediaKind: z.enum(["source", "audio", "segment", "generated"]).default("source"),
  workspaceId: z.string().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to DeVoice before uploading files." }, { status: 401 });
  }

  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "上传参数无效。" }, { status: 400 });
  }

  try {
    const workspace = await resolveWritableWorkspace(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      parsed.data.workspaceId
    );

    if (!hasR2Config()) {
      const storageKey = createLocalMediaStorageKey({
        workspaceId: workspace.id,
        fileName: parsed.data.fileName,
        mediaKind: parsed.data.mediaKind
      });
      const uploadUrl = createLocalMediaUploadUrl(storageKey);
      return NextResponse.json({
        upload: {
          mode: "local",
          storageKey,
          uploadUrl,
          publicUrl: uploadUrl,
          expiresIn: 0,
          message: "Cloud storage is not configured, so DeVoice will store this file in local media storage."
        }
      });
    }

    const upload = await createUploadUrl({
      ...parsed.data,
      workspaceId: workspace.id,
      folder: parsed.data.mediaKind === "audio" ? "audio" : parsed.data.mediaKind === "segment" ? "segments" : parsed.data.mediaKind === "generated" ? "generated" : "uploads"
    });
    return NextResponse.json({ upload: { ...upload, mode: "r2" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建上传签名失败。" },
      { status: 500 }
    );
  }
}
