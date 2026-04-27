import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

type Body = {
  mobile?: string;
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  userAgent?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const mobile = normalizeMobile(body?.mobile?.trim() ?? "");
  const endpoint = body?.subscription?.endpoint?.trim() ?? "";
  const p256dh = body?.subscription?.keys?.p256dh?.trim() ?? "";
  const auth = body?.subscription?.keys?.auth?.trim() ?? "";
  const userAgent = (body?.userAgent ?? "").trim() || null;

  if (!mobile) return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh, auth, userAgent },
    update: { userId: user.id, p256dh, auth, userAgent },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, subscriptionId: sub.id });
}

