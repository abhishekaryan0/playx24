import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { mobile?: string } | null;
  const mobileRaw = body?.mobile?.trim() ?? "";
  const mobile = normalizeMobile(mobileRaw);

  if (!mobile) {
    return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true, mobile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const application = await prisma.application.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      bankDetails: true,
      walletDetails: true,
      platformDetails: true,
      brandRelation: true,
    },
  });

  return NextResponse.json({ user, application });
}

