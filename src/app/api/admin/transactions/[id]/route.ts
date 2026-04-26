import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

const ALLOWED = new Set(["PENDING", "APPROVED", "DECLINED"]);

async function requireAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSession(token, secret));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = (body?.status ?? "").toUpperCase();
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      status: status as any,
      adminId: "admin",
    },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ transaction: updated });
}

