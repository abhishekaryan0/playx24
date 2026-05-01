import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

export const runtime = "nodejs";

function generateWithdrawTransactionNo(): string {
  // Human-friendly transaction id for withdraw requests (unique enough for UI)
  // Example: TxnW-20260501-48231
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const digits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `TxnW-${yyyy}${mm}${dd}-${digits}`;
}

type SubmitBody = {
  mobile?: string;
  kind?: "USER_DEPOSIT" | "USER_WITHDRAW";
  amount?: number;
  method?: string;
  bankName?: string;
  walletProvider?: string;
  walletId?: string;
  transactionNo?: string;
  screenshotUrl?: string;
  note?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mobile = normalizeMobile(url.searchParams.get("mobile") ?? "");
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

  const transactions = await prisma.transaction.findMany({
    // Return all statuses for lists (statement filters APPROVED in UI).
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: Request) {
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

  const kind = body?.kind ?? "USER_DEPOSIT";

  const method = (body?.method ?? "").trim();
  const bankName = (body?.bankName ?? "").trim();
  const walletProvider = (body?.walletProvider ?? "").trim();
  const walletId = (body?.walletId ?? "").trim();
  const transactionNo = (body?.transactionNo ?? "").trim();
  const screenshotUrl = (body?.screenshotUrl ?? "").trim();
  const note = (body?.note ?? "").trim();
  const amountRaw = body?.amount;
  const amount =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? Math.floor(amountRaw)
      : NaN;

  const fieldErrors: Record<string, string> = {};
  if (!Number.isFinite(amount) || amount <= 0) fieldErrors.amount = "Amount is required";
  if (kind === "USER_DEPOSIT") {
    if (!method) fieldErrors.method = "Select bank or wallet";
    if (method === "wallet") {
      if (!walletProvider) fieldErrors.walletProvider = "Select your wallet";
      if (!walletId) fieldErrors.walletId = "Wallet ID is required";
    }
    if (method === "bank") {
      if (!bankName) fieldErrors.bankName = "Bank name is required";
    }
    if (!transactionNo) fieldErrors.transactionNo = "Transaction number is required";
    // Screenshot is optional for now.
  } else if (kind === "USER_WITHDRAW") {
    // Withdrawal request always needs wallet.
    if (!walletProvider) fieldErrors.walletProvider = "Select your wallet";
    if (!walletId) fieldErrors.walletId = "Wallet ID is required";
  } else {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 },
    );
  }

  const created = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: kind,
      status: "PENDING",
      amount,
      method: kind === "USER_DEPOSIT" ? method : "wallet",
      bankName: kind === "USER_DEPOSIT" ? bankName || null : null,
      walletProvider: walletProvider || null,
      walletId: walletId || null,
      transactionNo:
        kind === "USER_DEPOSIT"
          ? transactionNo
          : kind === "USER_WITHDRAW"
            ? generateWithdrawTransactionNo()
            : null,
      screenshotUrl: kind === "USER_DEPOSIT" ? screenshotUrl || null : null,
      note: note || null,
    },
    select: { id: true, status: true, createdAt: true },
  });

  return NextResponse.json({ transaction: created }, { status: 201 });
}

