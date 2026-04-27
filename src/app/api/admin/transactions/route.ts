import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { mobile: true } } },
  });

  return NextResponse.json({ transactions });
}

type SubmitBody = {
  mobile?: string;
  amount?: number;
  method?: string;
  bankName?: string;
  walletProvider?: string;
  walletId?: string;
  transactionNo?: string;
  screenshotUrl?: string;
};

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as SubmitBody | null;
  const mobile = normalizeMobile(body?.mobile?.trim() ?? "");
  if (!mobile) {
    return NextResponse.json({ error: "Missing mobile" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const method = (body?.method ?? "").trim();
  const bankName = (body?.bankName ?? "").trim();
  const walletProvider = (body?.walletProvider ?? "").trim();
  const walletId = (body?.walletId ?? "").trim();
  const transactionNo = (body?.transactionNo ?? "").trim();
  const screenshotUrl = (body?.screenshotUrl ?? "").trim();
  const amountRaw = body?.amount;
  const amount =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? Math.floor(amountRaw)
      : NaN;

  const fieldErrors: Record<string, string> = {};
  if (!method) fieldErrors.method = "Select bank or wallet";
  if (!Number.isFinite(amount) || amount <= 0) fieldErrors.amount = "Amount is required";
  if (method === "wallet") {
    if (!walletProvider) fieldErrors.walletProvider = "Select your wallet";
    if (!walletId) fieldErrors.walletId = "Wallet ID is required";
  }
  if (method === "bank") {
    if (!bankName) fieldErrors.bankName = "Bank name is required";
  }
  if (!transactionNo) fieldErrors.transactionNo = "Transaction number is required";
  // Screenshot is optional for now.

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 },
    );
  }

  const created = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "ADMIN_DEPOSIT",
      status: "PENDING",
      amount,
      method,
      bankName: bankName || null,
      walletProvider: walletProvider || null,
      walletId: walletId || null,
      transactionNo,
      screenshotUrl: screenshotUrl || null,
      adminId: "admin",
    },
    select: { id: true, status: true, createdAt: true },
  });

  return NextResponse.json({ transaction: created }, { status: 201 });
}

