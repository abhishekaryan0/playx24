import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = (formData.get("kind") as string | null) ?? "file";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const extFromName = path.extname(file.name || "").slice(0, 10);
  const ext =
    extFromName && /^[.\w]+$/.test(extFromName) ? extFromName : ".bin";

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const safeKind = kind.replace(/[^\w-]/g, "").slice(0, 32) || "file";
  const filename = `${safeKind}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}${ext}`;
  const filepath = path.join(uploadsDir, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);

  // Prefer API path so images work even when `public/uploads` is not part of the static bundle.
  return NextResponse.json(
    { url: `/api/uploads/file/${filename}` },
    { status: 201 },
  );
}

