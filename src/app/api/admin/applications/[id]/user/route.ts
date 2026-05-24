import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSession(token, secret));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = id?.trim() ?? "";
  if (!applicationId) {
    return NextResponse.json({ error: "Application id required" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      userId: true,
      mobileNumber: true,
      user: { select: { id: true, mobile: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  let userId = application.userId ?? application.user?.id ?? null;

  if (!userId) {
    const mobile = normalizeMobile(application.mobileNumber?.trim() ?? "");
    if (mobile) {
      const byMobile = await prisma.user.findUnique({
        where: { mobile },
        select: { id: true },
      });
      userId = byMobile?.id ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "No login account found for this application" },
      { status: 404 },
    );
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    throw e;
  }
}
