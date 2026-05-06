import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";
import { normalizeMobile } from "@/lib/mobile";
import { configureWebPush, getWebPushConfig, webpush } from "@/lib/web-push";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSession(token, secret));
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mobile = normalizeMobile(url.searchParams.get("mobile") ?? "");
  const type = (url.searchParams.get("type") ?? "").trim().toUpperCase();

  const user = mobile
    ? await prisma.user.findUnique({ where: { mobile }, select: { id: true } })
    : null;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(user?.id ? { userId: user.id } : {}),
      ...(type ? { type: type as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
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

  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "ADMIN_DEPOSIT_CREATED",
      title: "Deposit added",
      message: `Admin added a deposit of ${amount}.`,
      data: {
        transactionId: created.id,
        amount,
        status: created.status,
      },
    },
    select: { id: true },
  });

  // Best-effort Web Push (works even when site is closed)
  const cfg = getWebPushConfig();
  if (cfg) {
    configureWebPush(cfg);
    const subs: Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }> = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: { endpoint: true, p256dh: true, auth: true, id: true },
    });

    const payload = JSON.stringify({
      title: "Deposit added",
      body: `Admin added a deposit of ${amount}.`,
      data: { url: "/my-application?tab=depositRequest", transactionId: created.id },
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch (e: unknown) {
          const code =
            typeof e === "object" && e && "statusCode" in e
              ? (e as { statusCode?: unknown }).statusCode
              : undefined;
          if (code === 404 || code === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } });
          }
        }
      }),
    );
  }

  return NextResponse.json({ transaction: created }, { status: 201 });
}

