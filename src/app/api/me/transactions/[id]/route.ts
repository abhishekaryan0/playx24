import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

const ALLOWED = new Set(["APPROVED", "DECLINED"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { mobile?: string; status?: string }
    | null;

  const mobile = normalizeMobile(body?.mobile?.trim() ?? "");
  const status = (body?.status ?? "").toUpperCase();

  if (!mobile) {
    return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  }
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { id: true, userId: true, type: true, status: true },
  });
  if (!tx || tx.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // User can only accept/reject admin-submitted deposits.
  if (tx.type !== "ADMIN_DEPOSIT") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (tx.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { status: status as any },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ transaction: updated });
}

