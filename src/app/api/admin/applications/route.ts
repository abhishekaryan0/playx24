import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSession(token, secret));
}

function asInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  // Expect YYYY-MM-DD from <input type="date">
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;

  const page = asInt(sp.get("page"), 1);
  const pageSize = Math.min(50, asInt(sp.get("pageSize"), 10));
  const skip = (page - 1) * pageSize;

  const status = (sp.get("status") ?? "").toUpperCase();
  const type = (sp.get("type") ?? "").toUpperCase();
  const q = (sp.get("q") ?? "").trim();

  const from = parseDateOnly(sp.get("from"));
  const to = parseDateOnly(sp.get("to"));

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (type && type !== "ALL") where.type = type;

  if (from || to) {
    // Filter by createdAt day range (inclusive)
    const gte = from ? new Date(from) : undefined;
    const lt = to
      ? new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000)
      : undefined;
    where.createdAt = { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) };
  }

  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { mobileNumber: { contains: q, mode: "insensitive" } },
      { telegramId: { contains: q, mode: "insensitive" } },
      { whatsappNumber: { contains: q, mode: "insensitive" } },
      { user: { is: { mobile: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, mobile: true } },
      },
    }),
  ]);

  return NextResponse.json({
    applications,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
