import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".bin": "application/octet-stream",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments?.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  const relative = segments.join("/");
  if (!relative || relative.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const filepath = path.join(uploadsRoot, ...segments);
  const resolvedFile = path.resolve(filepath);
  if (!resolvedFile.startsWith(path.resolve(uploadsRoot))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(resolvedFile);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(relative).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
