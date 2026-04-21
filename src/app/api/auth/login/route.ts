import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { mobile?: string; password?: string }
    | null;

  const mobileRaw = body?.mobile?.trim();
  const password = body?.password ?? "";

  if (!mobileRaw) {
    return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  }

  const mobile = normalizeMobile(mobileRaw);
  if (!mobile) {
    return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true, mobile: true, password: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Mobile-only login when password is not set; otherwise verify password (legacy accounts).
  if (user.password) {
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  return NextResponse.json({ id: user.id, mobile: user.mobile });
}

