import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { mobile?: string; password?: string }
    | null;

  const mobile = body?.mobile?.trim();
  const password = body?.password ?? "";

  if (!mobile || !password) {
    return NextResponse.json(
      { error: "Missing mobile or password" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true, mobile: true, password: true, createdAt: true },
  });

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Session/cookies not implemented yet; this just validates.
  return NextResponse.json({ id: user.id, mobile: user.mobile });
}

