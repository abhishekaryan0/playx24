import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

type Body = { mobile?: string; endpoint?: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const mobile = normalizeMobile(body?.mobile?.trim() ?? "");
  const endpoint = body?.endpoint?.trim() ?? "";

  if (!mobile) return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
    select: { id: true, userId: true },
  });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ ok: true });
  }

  await prisma.pushSubscription.delete({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}

