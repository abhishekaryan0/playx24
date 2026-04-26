"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { applicationTypeLabel } from "@/lib/application-type";
import { resolvePublicUploadUrl } from "@/lib/upload-url";

type ApplicationDetail = {
  id: string;
  type: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  country: string | null;
  whatsappNumber: string | null;
  mobileNumber: string | null;
  telegramId: string | null;
  documentUrl: string | null;
  profilePicUrl: string | null;
  createdAt: string;
  updatedAt: string;
  bankDetails: {
    accountNumber: string | null;
    ifscCode: string | null;
    bankName: string | null;
    holderName: string | null;
    branchName: string | null;
  } | null;
  walletDetails: { provider: string | null; walletId: string | null } | null;
  platformDetails: {
    platformName: string | null;
    platformLink: string | null;
    usersRange: string | null;
    turnoverRange: string | null;
  } | null;
  brandRelation: {
    usernameInPlatform: string | null;
    hadPreviousTransaction: boolean | null;
    transactionId: string | null;
  } | null;
};

type ApiResponse = {
  user?: { id: string; mobile: string };
  application?: ApplicationDetail | null;
  error?: string;
};

type TransactionRow = {
  id: string;
  type: "ADMIN_DEPOSIT" | "USER_DEPOSIT";
  status: "PENDING" | "APPROVED" | "DECLINED";
  amount: number | null;
  method: string | null;
  bankName: string | null;
  walletProvider: string | null;
  walletId: string | null;
  transactionNo: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
  adminId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
      <div className="border-b border-emerald-900/10 bg-[#1b4332]/[0.05] px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1b4332]">
          {title}
        </h2>
      </div>
      <div className="space-y-3 p-5 text-sm">{children}</div>
    </section>
  );
}

function KeyValueRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  const text = value ? String(value) : "—";
  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={[
          "mt-1 break-words text-sm text-zinc-900",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {text}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80"
      : s === "REJECTED"
        ? "bg-red-100 text-red-900 ring-1 ring-red-200/80"
        : s === "PENDING"
          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${cls}`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}

function MediaBlock({ url, label }: { url: string | null | undefined; label: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return <p className="text-sm text-zinc-400">Not uploaded</p>;
  const resolved = resolvePublicUploadUrl(url) ?? url;
  const lower = resolved.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return (
      <a
        href={resolved}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
      >
        Open PDF document
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full text-left"
        aria-label={`Preview ${label}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt={label}
          className="max-h-72 w-full rounded-lg border border-zinc-200 bg-zinc-50 object-contain transition group-hover:border-emerald-300"
        />
        <p className="mt-2 text-xs font-medium text-zinc-500 group-hover:text-zinc-700">
          Click to preview
        </p>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-5xl rounded-t-2xl border border-zinc-200 border-b-0 bg-white shadow-2xl sm:rounded-2xl sm:border-b"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "min(90vh, 900px)",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {label} preview
                </p>
                <a
                  href={resolved}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex text-xs font-medium text-emerald-700 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <div className="grid place-items-center overflow-auto rounded-xl bg-black/[0.03] p-2 sm:p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolved}
                  alt={label}
                  className="max-h-[70vh] w-auto max-w-full rounded-lg border border-zinc-200 bg-white object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function MyApplicationPage() {
  const storageKey = useMemo(() => "play24x:auth:mobile", []);
  const [mobile, setMobile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositSaving, setDepositSaving] = useState(false);
  const [depositMessage, setDepositMessage] = useState<string | null>(null);
  const [depositErrors, setDepositErrors] = useState<Record<string, string>>({});
  const [depositMethod, setDepositMethod] = useState<"bank" | "wallet" | "">(
    "",
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [depositBankName, setDepositBankName] = useState("");
  const [depositWalletProvider, setDepositWalletProvider] = useState("");
  const [depositWalletId, setDepositWalletId] = useState("");
  const [depositTxNo, setDepositTxNo] = useState("");
  const [depositScreenshotUrl, setDepositScreenshotUrl] = useState<string>("");
  const [depositScreenshotName, setDepositScreenshotName] = useState<string>("");

  const [tab, setTab] = useState<
    "depositRequest" | "payRecord" | "statement" | "profile"
  >("profile");

  const [statementQuery, setStatementQuery] = useState("");
  const [statementDate, setStatementDate] = useState("");

  useEffect(() => {
    const m = window.localStorage.getItem(storageKey) ?? "";
    setMobile(m);
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!mobile) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/me/application", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile }),
        });
        const json = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok) {
          const msg = json?.error || "Failed to load details";
          throw new Error(msg);
        }
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        const msg =
          isRecord(e) && typeof e.message === "string"
            ? e.message
            : "Failed to load details";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [mobile]);

  const loadTransactions = useCallback(async () => {
    if (!mobile) return;
    setTxLoading(true);
    setTxError(null);
    try {
      const res = await fetch(
        `/api/me/transactions?mobile=${encodeURIComponent(mobile)}`,
      );
      const json = (await res.json().catch(() => null)) as
        | { transactions?: TransactionRow[]; error?: string }
        | null;
      if (!res.ok) throw new Error(json?.error || "Failed to load transactions");
      setTx((json?.transactions as TransactionRow[]) ?? []);
    } catch (e: unknown) {
      const msg =
        isRecord(e) && typeof e.message === "string"
          ? e.message
          : "Failed to load transactions";
      setTxError(msg);
    } finally {
      setTxLoading(false);
    }
  }, [mobile]);

  useEffect(() => {
    if (!mobile) return;
    loadTransactions();
  }, [loadTransactions, mobile]);

  async function uploadScreenshot(file: File) {
    const up = new FormData();
    up.set("kind", "deposit");
    up.set("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: up });
    if (!res.ok) throw new Error("Upload failed");
    const json = (await res.json()) as { url: string };
    return json.url;
  }

  const application = data?.application ?? undefined;
  const appStatus = application?.status ?? "";

  const filteredTx = useMemo(() => {
    const q = statementQuery.trim().toLowerCase();
    const datePreset = statementDate;
    const now = new Date();
    const lowerBound =
      datePreset === "today"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        : datePreset === "7d"
          ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : datePreset === "30d"
            ? now.getTime() - 30 * 24 * 60 * 60 * 1000
            : null;

    return tx.filter((t) => {
      if (q) {
        const hay = `${t.transactionNo ?? ""} ${t.amount ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (lowerBound != null) {
        const ts = new Date(t.createdAt).getTime();
        if (!Number.isFinite(ts) || ts < lowerBound) return false;
      }
      return true;
    });
  }, [statementDate, statementQuery, tx]);

  const statementTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const t of filteredTx) {
      const amt = typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
      // For now we treat both ADMIN_DEPOSIT and USER_DEPOSIT as deposits (money coming in).
      // When you add withdrawals later, we’ll put them into Total OUT.
      totalIn += amt;
    }
    const balance = totalIn - totalOut;
    return { totalIn, totalOut, balance };
  }, [filteredTx]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90 pb-16">
      <AdminHeader
        maxWidth="6xl"
        title="Applications"
        description="Full submission including documents and linked account."
        back={{ href: "/", label: "Back to login" }}
        actions={
          mobile ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="font-mono text-xs text-zinc-500">{mobile}</span>
              {appStatus ? <StatusPill status={appStatus} /> : null}
            </div>
          ) : null
        }
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {mobile ? (
          <div className="rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
              <DashTab
                active={tab === "depositRequest"}
                onClick={() => setTab("depositRequest")}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 7H4" />
                    <path d="M20 12H4" />
                    <path d="M20 17H4" />
                  </svg>
                }
              >
                Deposit Request
              </DashTab>
              <DashTab
                active={tab === "payRecord"}
                onClick={() => setTab("payRecord")}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M8 16h6" />
                  </svg>
                }
              >
                Pay Record
              </DashTab>
              <DashTab
                active={tab === "statement"}
                onClick={() => setTab("statement")}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 2h9l3 3v17H6z" />
                    <path d="M9 9h6" />
                    <path d="M9 13h6" />
                    <path d="M9 17h4" />
                  </svg>
                }
              >
                Statement
              </DashTab>
              <DashTab
                active={tab === "profile"}
                onClick={() => setTab("profile")}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              >
                Profile
              </DashTab>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDepositMessage(null);
                  setDepositErrors({});
                  setDepositOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] lg:self-auto"
              >
                Submit Deposit
              </button>
            </div>
          </div>
        ) : null}
        {!mobile ? (
          <Section title="Not logged in">
            <p className="text-sm text-zinc-600">
              Please login first to view your submitted details.
            </p>
          </Section>
        ) : loading ? (
          <Section title="Loading">
            <p className="text-sm text-zinc-600">Loading your details…</p>
          </Section>
        ) : error ? (
          <Section title="Error">
            <p className="text-sm text-red-700">{error}</p>
          </Section>
        ) : !application ? (
          <Section title="No application found">
            <p className="text-sm text-zinc-600">
              We couldn’t find an application for mobile <b>{mobile}</b>.
            </p>
          </Section>
        ) : (
          <>
            {tab === "depositRequest" ? (
              <Section title="Deposit request">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-600">
                    Submit a deposit and track its approval status.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDepositMessage(null);
                      setDepositErrors({});
                      setDepositOpen(true);
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]"
                  >
                    Submit deposit
                  </button>
                </div>

                {txError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {txError}
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-emerald-900/10">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Wallet / Bank</th>
                        <th className="px-4 py-3">Transaction no.</th>
                        <th className="px-4 py-3">Screenshot</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {txLoading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-zinc-500"
                          >
                            Loading…
                          </td>
                        </tr>
                      ) : tx.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-zinc-500"
                          >
                            No deposit requests yet.
                          </td>
                        </tr>
                      ) : (
                        tx.map((t) => (
                          <tr key={t.id} className="hover:bg-emerald-50/40">
                            <td className="px-4 py-3 text-xs font-semibold text-zinc-800">
                              {t.type === "ADMIN_DEPOSIT"
                                ? "Admin deposit"
                                : "User deposit"}
                            </td>
                            <td className="px-4 py-3">
                              <TxStatusBadge status={t.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-700">
                              {t.method ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-700">
                              {t.method === "wallet"
                                ? `${t.walletProvider ?? "—"} • ${t.walletId ?? "—"}`
                                : `${t.bankName ?? "—"}`}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-800">
                              {t.transactionNo ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {t.screenshotUrl ? (
                                <a
                                  href={
                                    resolvePublicUploadUrl(t.screenshotUrl) ??
                                    t.screenshotUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-emerald-700 underline"
                                >
                                  View
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-500">
                              {new Date(t.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            ) : null}

            {tab === "payRecord" ? (
              <Section title="Pay record">
                <p className="text-sm text-zinc-600">Coming soon.</p>
              </Section>
            ) : null}

            {tab === "statement" ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard
                      title="Commission"
                      value="$ 0"
                      tone="amber"
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v10" />
                          <path d="M8.5 10.5h7" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Total IN"
                      value={`$ ${statementTotals.totalIn.toLocaleString()}`}
                      tone="emerald"
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Total OUT"
                      value={`- $ ${statementTotals.totalOut.toLocaleString()}`}
                      tone="rose"
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12h8" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Balance"
                      value={`$ ${statementTotals.balance.toLocaleString()}`}
                      tone="sky"
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 2v20" />
                          <path d="M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3 3 0 0 1 0 6H6" />
                        </svg>
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03] sm:p-4">
                  <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 21v-7" />
                        <path d="M4 10V3" />
                        <path d="M12 21v-9" />
                        <path d="M12 8V3" />
                        <path d="M20 21v-5" />
                        <path d="M20 12V3" />
                        <path d="M1 14h6" />
                        <path d="M9 8h6" />
                        <path d="M17 16h6" />
                      </svg>
                      Filter by
                    </button>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </span>
                      <input
                        value={statementQuery}
                        onChange={(e) => setStatementQuery(e.target.value)}
                        placeholder="Search by transaction ID"
                        className="min-h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                        className="min-h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-700 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">Select Date</option>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
                        </svg>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadCsvStatement(mobile, filteredTx)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M7 10l5 5 5-5" />
                        <path d="M12 15V3" />
                      </svg>
                      Download Statement
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                          <th className="px-5 py-4">Date + time</th>
                          <th className="px-5 py-4">Wallet details</th>
                          <th className="px-5 py-4">Transaction ID</th>
                          <th className="px-5 py-4 text-right">Withdrawal</th>
                          <th className="px-5 py-4 text-right">Deposits</th>
                          <th className="px-5 py-4 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredTx.map((t) => (
                            <tr key={t.id} className="hover:bg-emerald-50/40">
                              <td className="px-5 py-4 text-xs text-zinc-700">
                                {new Date(t.createdAt).toLocaleString()}
                              </td>
                              <td className="px-5 py-4 text-xs text-zinc-700">
                                {(t.walletProvider || t.method || "—") +
                                  (t.walletId ? ` - ${t.walletId}` : "")}
                              </td>
                              <td className="px-5 py-4 font-mono text-xs text-zinc-800">
                                {t.transactionNo ?? "—"}
                              </td>
                              <td className="px-5 py-4 text-right text-xs text-zinc-700">
                                $ 0
                              </td>
                              <td className="px-5 py-4 text-right text-xs text-zinc-700">
                                $ {(t.amount ?? 0).toLocaleString()}
                              </td>
                              <td className="px-5 py-4 text-right text-xs text-zinc-700">
                                {/* Running balance is computed in CSV; UI shows total balance for now */}
                                $ {statementTotals.balance.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        {filteredTx.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-14 text-center text-zinc-500"
                            >
                              No statement entries yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "profile" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
              <div className="space-y-6">
                <Section title="Overview">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <KeyValueRow
                      label="Applicant"
                      value={[application.firstName, application.lastName]
                        .filter(Boolean)
                        .join(" ") || null}
                    />
                    <KeyValueRow
                      label="Application type"
                      value={applicationTypeLabel(application.type)}
                    />
                    <KeyValueRow label="Status" value={application.status} />
                    <KeyValueRow label="Country" value={application.country} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <KeyValueRow
                      label="Created"
                      value={new Date(application.createdAt).toLocaleString()}
                    />
                    <KeyValueRow
                      label="Updated"
                      value={new Date(application.updatedAt).toLocaleString()}
                    />
                  </div>
                </Section>

                <Section title="Primary information">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <KeyValueRow label="Whatsapp" value={application.whatsappNumber} mono />
                    <KeyValueRow label="Mobile" value={application.mobileNumber} mono />
                    <KeyValueRow label="Telegram" value={application.telegramId} />
                    <KeyValueRow label="Address" value={application.address} />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Document
                      </p>
                      <MediaBlock url={application.documentUrl} label="Document" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Profile picture
                      </p>
                      <MediaBlock url={application.profilePicUrl} label="Profile picture" />
                    </div>
                  </div>
                </Section>

                {application.type === "WALLET_BANK_AGENT" ? (
                  <>
                    {application.bankDetails ? (
                      <Section title="Bank details">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <KeyValueRow
                            label="Account number"
                            value={application.bankDetails.accountNumber}
                            mono
                          />
                          <KeyValueRow
                            label="IFSC"
                            value={application.bankDetails.ifscCode}
                            mono
                          />
                          <KeyValueRow label="Bank name" value={application.bankDetails.bankName} />
                          <KeyValueRow label="Holder name" value={application.bankDetails.holderName} />
                          <KeyValueRow label="Branch" value={application.bankDetails.branchName} />
                        </div>
                      </Section>
                    ) : null}

                    {application.walletDetails ? (
                      <Section title="Wallet details">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <KeyValueRow label="Provider" value={application.walletDetails.provider} />
                          <KeyValueRow
                            label="Wallet / UPI"
                            value={application.walletDetails.walletId}
                            mono
                          />
                        </div>
                      </Section>
                    ) : null}
                  </>
                ) : null}

                {application.type === "AGENT" && application.platformDetails ? (
                  <Section title="Platform details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KeyValueRow label="Platform name" value={application.platformDetails.platformName} />
                      <KeyValueRow label="Platform link" value={application.platformDetails.platformLink} />
                      <KeyValueRow label="Users (range)" value={application.platformDetails.usersRange} />
                      <KeyValueRow label="Turnover (range)" value={application.platformDetails.turnoverRange} />
                    </div>
                  </Section>
                ) : null}

                {application.brandRelation ? (
                  <Section title="Brand relation">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KeyValueRow
                        label="Username in platform"
                        value={application.brandRelation.usernameInPlatform}
                      />
                      <KeyValueRow
                        label="Previous transaction"
                        value={
                          application.brandRelation.hadPreviousTransaction === null
                            ? null
                            : application.brandRelation.hadPreviousTransaction
                              ? "Yes"
                              : "No"
                        }
                      />
                      <KeyValueRow
                        label="Transaction ID"
                        value={application.brandRelation.transactionId}
                        mono
                      />
                    </div>
                  </Section>
                ) : null}
              </div>

              <aside className="space-y-6 lg:sticky lg:top-6">
                <Section title="Finance">
                  <FinanceRow label="Commission:" placeholder="amount" />
                  <FinanceRow label="Cash In:" placeholder="amount" />
                  <FinanceRow label="Cash Out:" placeholder="amount" />
                  <FinanceRow label="Balance:" placeholder="amount" />
                  <FinanceRow
                    label="ACT"
                    helper="(Average Confirmation Time)"
                    placeholder="5.00 s"
                  />
                </Section>
                <Section title="Status">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-600">Current status</p>
                    <StatusPill status={application.status} />
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-900/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Note
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      We will review your application and update the status soon.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/"
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Logout
                    </Link>
                  </div>
                </Section>
              </aside>
            </div>
            ) : null}
          </>
        )}
      </main>

      {depositOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setDepositOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-zinc-200 border-b-0 bg-white shadow-2xl sm:rounded-2xl sm:border-b"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Deposit details
              </p>
            </div>

            <form
              className="space-y-4 px-5 py-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setDepositMessage(null);
                setDepositErrors({});
                setDepositSaving(true);
                try {
                  const amount = Number(depositAmount);
                  const res = await fetch("/api/me/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mobile,
                      amount,
                      method: depositMethod,
                      bankName: depositBankName,
                      walletProvider: depositWalletProvider,
                      walletId: depositWalletId,
                      transactionNo: depositTxNo,
                      screenshotUrl: depositScreenshotUrl,
                    }),
                  });
                  const json = (await res.json().catch(() => null)) as
                    | {
                        transaction?: { id: string };
                        fieldErrors?: Record<string, string>;
                        error?: string;
                      }
                    | null;
                  if (!res.ok) {
                    setDepositErrors(json?.fieldErrors ?? {});
                    throw new Error(json?.error || "Submit failed");
                  }

                  setDepositOpen(false);
                  setDepositMethod("");
                  setDepositAmount("");
                  setDepositBankName("");
                  setDepositWalletProvider("");
                  setDepositWalletId("");
                  setDepositTxNo("");
                  setDepositScreenshotUrl("");
                  setDepositScreenshotName("");
                  await loadTransactions();
                } catch (err: unknown) {
                  const msg =
                    isRecord(err) && typeof err.message === "string"
                      ? err.message
                      : "Submit failed";
                  setDepositMessage(msg);
                } finally {
                  setDepositSaving(false);
                }
              }}
            >
              {depositMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {depositMessage}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  select bank or wallet
                </label>
                <div className="relative">
                  <select
                    value={depositMethod}
                    onChange={(e) => {
                      setDepositMethod(e.target.value as any);
                      setDepositErrors((prev) => {
                        const next = { ...prev };
                        delete next.method;
                        return next;
                      });
                    }}
                    className={[
                      "min-h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-700 outline-none",
                      depositErrors.method ? "border-red-300" : "border-zinc-200",
                    ].join(" ")}
                  >
                    <option value="">select bank or wallet</option>
                    <option value="bank">Bank</option>
                    <option value="wallet">Wallet</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
                    </svg>
                  </span>
                </div>
                {depositErrors.method ? (
                  <p className="text-xs text-red-600">{depositErrors.method}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  amount
                </label>
                <input
                  inputMode="numeric"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    depositErrors.amount ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {depositErrors.amount ? (
                  <p className="text-xs text-red-600">{depositErrors.amount}</p>
                ) : null}
              </div>

              {depositMethod === "wallet" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      select your wallet
                    </label>
                    <div className="relative">
                      <select
                        value={depositWalletProvider}
                        onChange={(e) => setDepositWalletProvider(e.target.value)}
                        className={[
                          "min-h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-700 outline-none",
                          depositErrors.walletProvider ? "border-red-300" : "border-zinc-200",
                        ].join(" ")}
                      >
                        <option value="">Select your wallet</option>
                        <option value="Nagad">Nagad</option>
                        <option value="bKash">bKash</option>
                        <option value="Rocket">Rocket</option>
                        <option value="uPay">uPay</option>
                        <option value="SureCash">SureCash</option>
                        <option value="Tap">Tap</option>
                        <option value="iPay">iPay</option>
                        <option value="Google Pay">Google Pay</option>
                        <option value="CashBaba">CashBaba</option>
                        <option value="OK Wallet">OK Wallet</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
                        </svg>
                      </span>
                    </div>
                    {depositErrors.walletProvider ? (
                      <p className="text-xs text-red-600">
                        {depositErrors.walletProvider}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      enter wallet id
                    </label>
                    <input
                      value={depositWalletId}
                      onChange={(e) => setDepositWalletId(e.target.value)}
                      placeholder="Enter Wallet ID"
                      className={[
                        "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                        depositErrors.walletId ? "border-red-300" : "border-zinc-200",
                      ].join(" ")}
                    />
                    {depositErrors.walletId ? (
                      <p className="text-xs text-red-600">{depositErrors.walletId}</p>
                    ) : null}
                  </div>
                </>
              ) : depositMethod === "bank" ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    bank name
                  </label>
                  <input
                    value={depositBankName}
                    onChange={(e) => setDepositBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className={[
                      "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                      depositErrors.bankName ? "border-red-300" : "border-zinc-200",
                    ].join(" ")}
                  />
                  {depositErrors.bankName ? (
                    <p className="text-xs text-red-600">{depositErrors.bankName}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  transaction no.
                </label>
                <input
                  value={depositTxNo}
                  onChange={(e) => setDepositTxNo(e.target.value)}
                  placeholder="Enter transaction no."
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    depositErrors.transactionNo ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {depositErrors.transactionNo ? (
                  <p className="text-xs text-red-600">{depositErrors.transactionNo}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  upload screenshot
                </label>
                <div
                  className={[
                    "rounded-xl border bg-white px-4 py-7",
                    depositErrors.screenshotUrl ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (!f) return;
                    try {
                      setDepositSaving(true);
                      setDepositScreenshotName(f.name);
                      const url = await uploadScreenshot(f);
                      setDepositScreenshotUrl(url);
                      setDepositErrors((prev) => {
                        const next = { ...prev };
                        delete next.screenshotUrl;
                        return next;
                      });
                    } catch (e) {
                      setDepositMessage(
                        isRecord(e) && typeof e.message === "string"
                          ? e.message
                          : "Upload failed",
                      );
                    } finally {
                      setDepositSaving(false);
                    }
                  }}
                >
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-600 text-white">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M8 14l2-2 3 3 3-3 2 2" />
                        <path d="M12 8h.01" />
                      </svg>
                    </div>
                    <p className="text-xs text-zinc-500">Drag and drop Image here</p>
                    <p className="text-xs text-zinc-300">or</p>
                    <input
                      id="deposit-screenshot"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setDepositSaving(true);
                          setDepositScreenshotName(f.name);
                          const url = await uploadScreenshot(f);
                          setDepositScreenshotUrl(url);
                          setDepositErrors((prev) => {
                            const next = { ...prev };
                            delete next.screenshotUrl;
                            return next;
                          });
                        } catch (e) {
                          setDepositMessage(
                            isRecord(e) && typeof e.message === "string"
                              ? e.message
                              : "Upload failed",
                          );
                        } finally {
                          setDepositSaving(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("deposit-screenshot")?.click()
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[0.99]"
                    >
                      Upload Document
                    </button>
                    {depositScreenshotName ? (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {depositScreenshotName}
                        {depositScreenshotUrl ? " (uploaded)" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                {depositErrors.screenshotUrl ? (
                  <p className="text-xs text-red-600">{depositErrors.screenshotUrl}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={depositSaving}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {depositSaving ? "Submitting…" : "Submit Deposit"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TxStatusBadge({ status }: { status: TransactionRow["status"] }) {
  const cls =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80"
      : status === "DECLINED"
        ? "bg-red-100 text-red-900 ring-1 ring-red-200/80"
        : "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function DashTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
        active
          ? "border-emerald-200 bg-emerald-600 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      ].join(" ")}
    >
      <span className={active ? "text-white/90" : "text-zinc-500"} aria-hidden>
        {icon}
      </span>
      {children}
    </button>
  );
}

function FinanceRow({
  label,
  helper,
  placeholder,
}: {
  label: string;
  helper?: string;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}{" "}
        {helper ? (
          <span className="ml-1 font-normal normal-case text-zinc-300">
            {helper}
          </span>
        ) : null}
      </div>
      <input
        disabled
        defaultValue=""
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-300 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: "amber" | "emerald" | "rose" | "sky";
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === "amber"
      ? "text-amber-700 bg-amber-50 ring-amber-200/70"
      : tone === "emerald"
        ? "text-emerald-700 bg-emerald-50 ring-emerald-200/70"
        : tone === "rose"
          ? "text-rose-700 bg-rose-50 ring-rose-200/70"
          : "text-sky-700 bg-sky-50 ring-sky-200/70";
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${toneCls}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function downloadCsvStatement(mobile: string, rows: TransactionRow[]) {
  const safeMobile = (mobile || "user").replace(/[^\w.-]+/g, "_").slice(0, 50);
  const filename = `statement-${safeMobile}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  // Sort ascending for running balance
  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let balance = 0;
  const lines: string[] = [];
  lines.push(
    [
      "Date+Time",
      "Wallet Details",
      "Transaction ID",
      "Withdrawal",
      "Deposits",
      "Balance",
      "Type",
      "Status",
    ].join(","),
  );

  for (const t of sorted) {
    const amt = typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
    const withdrawal = 0;
    const deposit = amt;
    balance += deposit - withdrawal;

    const walletDetails =
      (t.walletProvider || t.method || "") + (t.walletId ? ` - ${t.walletId}` : "");

    const cols = [
      new Date(t.createdAt).toLocaleString(),
      walletDetails,
      t.transactionNo ?? "",
      String(withdrawal),
      String(deposit),
      String(balance),
      t.type,
      t.status,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`);

    lines.push(cols.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

