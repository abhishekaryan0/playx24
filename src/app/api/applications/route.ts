import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { type?: "WALLET_BANK_AGENT" | "AGENT" }
    | null;

  const type = body?.type;
  if (!type) {
    return NextResponse.json({ error: "Missing type" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      type,
      status: "DRAFT",
    },
    select: { id: true },
  });

  return NextResponse.json(application, { status: 201 });
}

