import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

const ALLOWED = new Set(["APPROVED", "REJECTED", "PENDING"]);

async function requireAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSession(token, secret));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, mobile: true, createdAt: true } },
      bankDetails: true,
      walletDetails: true,
      platformDetails: true,
      brandRelation: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
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
  const status = body?.status?.trim().toUpperCase() ?? "";

  if (!ALLOWED.has(status)) {
    return NextResponse.json(
      { error: "status must be APPROVED, REJECTED, or PENDING" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
}
