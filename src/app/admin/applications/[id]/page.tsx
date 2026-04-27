"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applicationTypeLabel } from "@/lib/application-type";
import {
  isPendingReview,
  statusDisplayLabel,
} from "@/lib/application-status";
import { AdminHeader } from "../../_components/AdminHeader";
import { resolvePublicUploadUrl } from "@/lib/upload-url";
import { downloadCsvStatement } from "@/app/my-application/_components/utils";
import { formatCommissionPercent, getCommissionTier } from "@/lib/commission-tier";

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
  user: { id: string; mobile: string; password: string; createdAt: string } | null;
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
  user?: { mobile?: string | null } | null;
};

const COUNTRY_LABEL: Record<string, string> = {
  BD: "Bangladesh",
  IN: "India",
  PK: "Pakistan",
  US: "United States",
  GB: "United Kingdom",
};

function countryLabel(code: string | null | undefined) {
  if (!code) return "—";
  return COUNTRY_LABEL[code] ?? code;
}

function MediaBlock({
  url,
  label,
}: {
  url: string | null | undefined;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) {
    return <p className="text-sm text-zinc-400">Not uploaded</p>;
  }
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

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:items-start">
      <span className="font-medium text-zinc-500">{label}</span>
      <span className="text-zinc-900 break-words">{value ?? "—"}</span>
    </div>
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
    <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-900/10 bg-white px-4 py-3">
      <div className="min-w-0">
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
    </div>
  );
}

function PasswordRow({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-900/10 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Password
        </p>
        <p className="mt-1 break-words text-sm text-zinc-900 font-mono">
          {show ? password : "••••••••"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-900/10 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
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
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
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
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <path d="M12 9a3 3 0 0 1 3 3" />
            <path d="M3 3l18 18" />
          </svg>
        )}
      </button>
    </div>
  );
}

function DashTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-9 items-center rounded-lg border px-3 py-2 text-xs font-semibold transition",
        active
          ? "border-emerald-200 bg-emerald-600 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FinanceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <input
        disabled
        value={value}
        readOnly
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-300 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TierPill({
  tierLabel,
  pillClassName,
  iconClassName,
}: {
  tierLabel: string;
  pillClassName: string;
  iconClassName: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm",
        pillClassName,
      ].join(" ")}
    >
      <span
        className={[
          "grid h-6 w-6 place-items-center rounded-full ring-1 ring-black/5",
          iconClassName,
        ].join(" ")}
        aria-hidden="true"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
        </svg>
      </span>
      <span className="whitespace-nowrap">{tierLabel}</span>
    </span>
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

export default function AdminApplicationViewPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<
    "depositRequest" | "addPayment" | "profile" | "finance" | "statement"
  >("profile");
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txActionId, setTxActionId] = useState<string | null>(null);
  const [statementQuery, setStatementQuery] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "wallet" | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBankName, setPaymentBankName] = useState("");
  const [paymentWalletProvider, setPaymentWalletProvider] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [paymentTxNo, setPaymentTxNo] = useState("");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string>("");
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>("");

  // Must stay above any conditional return to keep hook order stable.
  // In admin:
  // - Deposit Request = user-submitted deposits (USER_DEPOSIT) needing review.
  // - Admin deposit = admin-created deposits (ADMIN_DEPOSIT) shown under Finance.
  const depositRequests = useMemo(
    () => tx.filter((t) => t.type === "USER_DEPOSIT"),
    [tx],
  );
  const adminDeposits = useMemo(
    () => tx.filter((t) => t.type === "ADMIN_DEPOSIT"),
    [tx],
  );

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

  const statementRows = useMemo(
    () => filteredTx.filter((t) => t.status === "APPROVED"),
    [filteredTx],
  );

  const statementTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const t of statementRows) {
      const amt =
        typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
      totalIn += amt;
    }
    const balance = totalIn - totalOut;
    return { totalIn, totalOut, balance };
  }, [statementRows]);

  const adminSubmittedRows = useMemo(() => adminDeposits, [adminDeposits]);

  const finance = useMemo(() => {
    const approved = tx.filter((t) => t.status === "APPROVED");
    const cashIn = approved
      .filter((t) => t.type === "USER_DEPOSIT")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const cashOut = approved
      .filter((t) => t.type === "ADMIN_DEPOSIT")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const balance = cashIn - cashOut;
    const tier = getCommissionTier(cashIn);
    const commission = Math.round(cashIn * tier.rate);

    const approvedUserDeposits = approved.filter(
      (t) => t.type === "USER_DEPOSIT" && t.adminId,
    );
    const actSeconds =
      approvedUserDeposits.length === 0
        ? null
        : approvedUserDeposits.reduce((sum, t) => {
            const a = new Date(t.createdAt).getTime();
            const b = new Date(t.updatedAt).getTime();
            const d = Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, b - a) : 0;
            return sum + d;
          }, 0) /
          approvedUserDeposits.length /
          1000;

    return { cashIn, cashOut, balance, tier, commission, actSeconds };
  }, [tx]);

  function formatAct(seconds: number | null) {
    if (seconds == null || !Number.isFinite(seconds)) return "—";
    const s = Math.max(0, seconds);
    if (s < 60) return `${s.toFixed(2)} s`;
    const totalSeconds = Math.round(s);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remSeconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${remSeconds}s`;
  }

  const statementTableRows = useMemo(() => {
    const sorted = [...statementRows].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let running = 0;
    return sorted.map((t) => {
      const amt = typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
      const withdrawal = t.type === "ADMIN_DEPOSIT" ? amt : 0;
      const deposit = t.type === "USER_DEPOSIT" ? amt : 0;
      running += deposit - withdrawal;
      return { t, withdrawal, deposit, running };
    });
  }, [statementRows]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      if (res.status === 401) {
        setSessionOk(false);
        return;
      }
      if (res.status === 404) {
        setLoadError("Application not found");
        setApp(null);
        return;
      }
      if (!res.ok) {
        setLoadError("Failed to load");
        return;
      }
      const data = (await res.json()) as { application: ApplicationDetail };
      setSessionOk(true);
      setApp(data.application);
    } catch {
      setLoadError("Failed to load");
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      const s = await fetch("/api/admin/session");
      const j = (await s.json()) as { ok?: boolean };
      if (!j.ok) {
        setSessionOk(false);
        return;
      }
      setSessionOk(true);
      await load();
    })();
  }, [load]);

  const txMobile = app?.user?.mobile ?? app?.mobileNumber ?? "";

  const loadTransactions = useCallback(async () => {
    if (!txMobile) return;
    setTxLoading(true);
    setTxError(null);
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.status === 401) {
        setSessionOk(false);
        return;
      }
      const json = (await res.json().catch(() => null)) as
        | { transactions?: TransactionRow[]; error?: string }
        | null;
      if (!res.ok) throw new Error(json?.error || "Failed to load transactions");
      const all = (json?.transactions ?? []) as TransactionRow[];
      const normalized = txMobile.replace(/\s+/g, "");
      const filtered = all.filter((t) => {
        const m = (t.user?.mobile ?? "").replace(/\s+/g, "");
        return m && normalized && m.includes(normalized);
      });
      setTx(filtered);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [txMobile]);

  useEffect(() => {
    if (!sessionOk || !txMobile) return;
    loadTransactions();
  }, [loadTransactions, sessionOk, txMobile]);

  async function setTransactionStatus(id: string, next: "APPROVED" | "DECLINED") {
    setTxActionId(id);
    setTxError(null);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json().catch(() => null)) as
        | { transaction?: { id: string }; error?: string }
        | null;
      if (!res.ok) throw new Error(json?.error || "Update failed");
      await loadTransactions();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTxActionId(null);
    }
  }

  async function uploadScreenshot(file: File) {
    const up = new FormData();
    up.set("kind", "deposit");
    up.set("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: up });
    if (!res.ok) throw new Error("Upload failed");
    const json = (await res.json()) as { url: string };
    return json.url;
  }

  async function updateStatus(next: "APPROVED" | "REJECTED" | "PENDING") {
    if (!app) return;
    setBusy(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setLoadError(d.error ?? "Update failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (sessionOk === false) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-gradient-to-b from-emerald-50/50 via-white to-zinc-50 px-4 py-16 text-center">
        <Image
          src="/images/play24x-logo.png"
          alt="Play24X"
          width={160}
          height={64}
          className="h-12 w-auto opacity-90"
        />
        <div className="max-w-sm rounded-2xl border border-emerald-900/10 bg-white p-8 shadow-lg ring-1 ring-emerald-900/[0.04]">
          <p className="text-sm text-zinc-600">
            Sign in to the admin console to view this application.
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-800 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  if (sessionOk === null || !app) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-gradient-to-b from-emerald-50/50 via-white to-zinc-50">
        <Image
          src="/images/play24x-logo.png"
          alt="Play24X"
          width={120}
          height={48}
          className="h-10 w-auto opacity-90"
        />
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-[#1b4332]" />
        <p className="text-sm text-zinc-500">{loadError ?? "Loading…"}</p>
      </div>
    );
  }

  const name = [app.firstName, app.lastName].filter(Boolean).join(" ") || "—";
  const pending = isPendingReview(app.status);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90 pb-16">
      <AdminHeader
        maxWidth="wide"
        title="Application details"
        description="Full submission including documents and linked account."
        back={{ href: "/admin", label: "Back to applications" }}
        meta={
          <p className="font-mono text-[11px] text-zinc-400">{app.id}</p>
        }
        actions={
          <>
            <TierPill
              tierLabel={finance.tier.label}
              pillClassName={finance.tier.pillClassName}
              iconClassName={finance.tier.iconClassName}
            />
            <StatusPill status={app.status} />
            {pending ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus("APPROVED")}
                  className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus("REJECTED")}
                  className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            ) : null}
            {app.status === "APPROVED" || app.status === "REJECTED" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => updateStatus("PENDING")}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Mark pending
              </button>
            ) : null}
          </>
        }
      />

      {loadError ? (
        <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {loadError}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
          <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <DashTab
                active={tab === "depositRequest"}
                onClick={() => setTab("depositRequest")}
              >
                Deposit Request
              </DashTab>
              <DashTab
                active={tab === "addPayment"}
                onClick={() => {
                  setTab("addPayment");
                  setPaymentMessage(null);
                  setPaymentErrors({});
                  setPaymentOpen(true);
                }}
              >
                Add payment
              </DashTab>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <DashTab active={tab === "profile"} onClick={() => setTab("profile")}>
                Profile
              </DashTab>
              <DashTab active={tab === "finance"} onClick={() => setTab("finance")}>
                Finance
              </DashTab>
              <DashTab
                active={tab === "statement"}
                onClick={() => setTab("statement")}
              >
                Statement
              </DashTab>
            </div>
          </div>
        </div>

        {tab === "depositRequest" ? (
          <Section title="Deposit request">
            <p className="text-sm text-zinc-600">
              User submitted deposits for this user.
            </p>

            {txError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {txError}
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-emerald-900/10">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Wallet / Bank</th>
                    <th className="px-4 py-3">Transaction no.</th>
                    <th className="px-4 py-3">Screenshot</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {txLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                        Loading…
                      </td>
                    </tr>
                  ) : depositRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                        No deposit requests yet.
                      </td>
                    </tr>
                  ) : (
                    depositRequests.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3">
                          <TxStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-zinc-800">
                          {t.amount ? t.amount.toLocaleString() : "—"}
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
                              href={resolvePublicUploadUrl(t.screenshotUrl) ?? t.screenshotUrl}
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
                        <td className="px-4 py-3 text-right">
                          {t.status === "PENDING" ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={txActionId === t.id}
                                onClick={() => setTransactionStatus(t.id, "APPROVED")}
                                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={txActionId === t.id}
                                onClick={() => setTransactionStatus(t.id, "DECLINED")}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        ) : null}

        {tab === "addPayment" ? null : null}

        {tab === "statement" ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Commission
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  0
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Total IN
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  {statementTotals.totalIn.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Total OUT
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  - {statementTotals.totalOut.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Balance
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  {statementTotals.balance.toLocaleString()}
                </p>
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
                    placeholder="Search by transaction ID, Amount"
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
                  onClick={() => downloadCsvStatement(txMobile, statementRows as any)}
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

            {txError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {txError}
              </div>
            ) : null}

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
                    {txLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-zinc-500">
                          Loading…
                        </td>
                      </tr>
                    ) : null}
                    {(!txLoading ? statementTableRows : []).map(
                      ({ t, withdrawal, deposit, running }) => (
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
                            {withdrawal ? withdrawal.toLocaleString() : 0}
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-zinc-700">
                            {deposit ? deposit.toLocaleString() : 0}
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-zinc-700">
                            {running.toLocaleString()}
                          </td>
                        </tr>
                      ),
                    )}
                    {!txLoading && statementTableRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-zinc-500">
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

        {tab === "finance" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <Section title="Overview">
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValueRow label="Applicant" value={name} />
                <KeyValueRow label="Type" value={applicationTypeLabel(app.type)} />
                <KeyValueRow label="Status" value={statusDisplayLabel(app.status)} />
                <KeyValueRow label="Country" value={countryLabel(app.country)} />
              </div>
            </Section>

            <Section title="Finance">
              <div className="grid gap-3">
                <FinanceRow label="Commission:" value={finance.commission.toLocaleString()} />
                <FinanceRow label="Cash In:" value={finance.cashIn.toLocaleString()} />
                <FinanceRow label="Cash Out:" value={finance.cashOut.toLocaleString()} />
                <FinanceRow label="Balance" value={finance.balance.toLocaleString()} />
                <FinanceRow
                  label="ACT"
                  value={formatAct(finance.actSeconds)}
                />
              </div>
            </Section>
          </div>
        ) : null}

        {tab === "finance" ? (
          <Section title="Admin deposit">
            <div className="overflow-x-auto rounded-xl border border-emerald-900/10">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Wallet / Bank</th>
                    <th className="px-4 py-3">Transaction no.</th>
                    <th className="px-4 py-3">Screenshot</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {txLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                        Loading…
                      </td>
                    </tr>
                  ) : adminSubmittedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                        No admin payments yet.
                      </td>
                    </tr>
                  ) : (
                    adminSubmittedRows.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3">
                          <TxStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-zinc-800">
                          {t.amount ? t.amount.toLocaleString() : "—"}
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
                              href={resolvePublicUploadUrl(t.screenshotUrl) ?? t.screenshotUrl}
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

        {tab === "profile" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="space-y-6">
            <Section title="Overview">
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValueRow label="Applicant" value={name} />
                <KeyValueRow
                  label="Type"
                  value={applicationTypeLabel(app.type)}
                />
                <KeyValueRow
                  label="Status"
                  value={statusDisplayLabel(app.status)}
                />
                <KeyValueRow
                  label="Country"
                  value={countryLabel(app.country)}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <KeyValueRow
                  label="Created"
                  value={new Date(app.createdAt).toLocaleString()}
                />
                <KeyValueRow
                  label="Updated"
                  value={new Date(app.updatedAt).toLocaleString()}
                />
              </div>
              {app.user ? (
                <div className="mt-3">
                  <KeyValueRow
                    label="Linked user mobile"
                    value={app.user.mobile}
                    mono
                  />
                </div>
              ) : null}
            </Section>

            <Section title="Primary information">
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValueRow label="First name" value={app.firstName} />
                <KeyValueRow label="Last name" value={app.lastName} />
                <KeyValueRow label="Whatsapp" value={app.whatsappNumber} mono />
                <KeyValueRow label="Mobile" value={app.mobileNumber} mono />
                <KeyValueRow label="Telegram" value={app.telegramId} />
              </div>
              <div className="mt-3">
                <Field label="Address" value={app.address ?? "—"} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Document
                  </p>
                  <MediaBlock url={app.documentUrl} label="Document" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Profile picture
                  </p>
                  <MediaBlock url={app.profilePicUrl} label="Profile" />
                </div>
              </div>
            </Section>

            {app.type === "WALLET_BANK_AGENT" ? (
              <>
                {app.bankDetails ? (
                  <Section title="Bank details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KeyValueRow
                        label="Account number"
                        value={app.bankDetails.accountNumber}
                        mono
                      />
                      <KeyValueRow
                        label="IFSC"
                        value={app.bankDetails.ifscCode}
                        mono
                      />
                      <KeyValueRow
                        label="Bank name"
                        value={app.bankDetails.bankName}
                      />
                      <KeyValueRow
                        label="Holder name"
                        value={app.bankDetails.holderName}
                      />
                      <KeyValueRow
                        label="Branch"
                        value={app.bankDetails.branchName}
                      />
                    </div>
                  </Section>
                ) : null}
                {app.walletDetails ? (
                  <Section title="Wallet details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KeyValueRow
                        label="Provider"
                        value={app.walletDetails.provider}
                      />
                      <KeyValueRow
                        label="Wallet / UPI"
                        value={app.walletDetails.walletId}
                        mono
                      />
                    </div>
                  </Section>
                ) : null}
              </>
            ) : null}

            {app.type === "AGENT" && app.platformDetails ? (
              <Section title="Platform details">
                <div className="grid gap-3 sm:grid-cols-2">
                  <KeyValueRow
                    label="Platform name"
                    value={app.platformDetails.platformName}
                  />
                  <KeyValueRow
                    label="Platform link"
                    value={app.platformDetails.platformLink}
                  />
                  <KeyValueRow
                    label="Users (range)"
                    value={app.platformDetails.usersRange}
                  />
                  <KeyValueRow
                    label="Turnover (range)"
                    value={app.platformDetails.turnoverRange}
                  />
                </div>
              </Section>
            ) : null}

            {app.brandRelation ? (
              <Section title="Brand relation">
                <div className="grid gap-3 sm:grid-cols-2">
                  <KeyValueRow
                    label="Username in platform"
                    value={app.brandRelation.usernameInPlatform}
                  />
                  <KeyValueRow
                    label="Previous transaction"
                    value={
                      app.brandRelation.hadPreviousTransaction === null
                        ? null
                        : app.brandRelation.hadPreviousTransaction
                          ? "Yes"
                          : "No"
                    }
                  />
                  <KeyValueRow
                    label="Transaction ID"
                    value={app.brandRelation.transactionId}
                    mono
                  />
                </div>
              </Section>
            ) : null}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6">
              <Section title="Finance">
                <div className="grid gap-3">
                  <FinanceRow label="Commission:" value={finance.commission.toLocaleString()} />
                  <FinanceRow label="Cash In:" value={finance.cashIn.toLocaleString()} />
                  <FinanceRow label="Cash Out:" value={finance.cashOut.toLocaleString()} />
                  <FinanceRow label="Balance" value={finance.balance.toLocaleString()} />
                  <FinanceRow
                    label="ACT"
                    value={
                      finance.actSeconds == null
                        ? "—"
                        : formatAct(finance.actSeconds)
                    }
                  />
                </div>
              </Section>

              <Section title="Quick actions">
                <div className="grid gap-3">
                  <KeyValueRow label="Application ID" value={app.id} mono />
                  <KeyValueRow
                    label="User mobile (login)"
                    value={app.user?.mobile ?? null}
                    mono
                  />
                  {app.user?.password ? <PasswordRow password={app.user.password} /> : null}
                  <div className="rounded-xl border border-emerald-900/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Review
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      Use the buttons in the header to approve/reject, then refresh to
                      confirm the status.
                    </p>
                  </div>
                </div>
              </Section>
            </aside>
          </div>
        ) : null}
      </main>

      {paymentOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setPaymentOpen(false)}
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
              className="max-h-[78vh] overflow-auto space-y-4 px-5 py-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setPaymentMessage(null);
                setPaymentErrors({});
                setPaymentSaving(true);
                try {
                  const amount = Number(paymentAmount);
                  const res = await fetch("/api/admin/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mobile: txMobile,
                      amount,
                      method: paymentMethod,
                      bankName: paymentBankName,
                      walletProvider: paymentWalletProvider,
                      walletId: paymentWalletId,
                      transactionNo: paymentTxNo,
                      screenshotUrl: paymentScreenshotUrl,
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
                    setPaymentErrors(json?.fieldErrors ?? {});
                    throw new Error(json?.error || "Submit failed");
                  }

                  setPaymentOpen(false);
                  setPaymentMethod("");
                  setPaymentAmount("");
                  setPaymentBankName("");
                  setPaymentWalletProvider("");
                  setPaymentWalletId("");
                  setPaymentTxNo("");
                  setPaymentScreenshotUrl("");
                  setPaymentScreenshotName("");
                  await loadTransactions();
                  setTab("depositRequest");
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Submit failed";
                  setPaymentMessage(msg);
                } finally {
                  setPaymentSaving(false);
                }
              }}
            >
              {paymentMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {paymentMessage}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  select bank or wallet
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as any);
                      setPaymentErrors((prev) => {
                        const next = { ...prev };
                        delete next.method;
                        return next;
                      });
                    }}
                    className={[
                      "min-h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-700 outline-none",
                      paymentErrors.method ? "border-red-300" : "border-zinc-200",
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
                {paymentErrors.method ? (
                  <p className="text-xs text-red-600">{paymentErrors.method}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  amount
                </label>
                <input
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    paymentErrors.amount ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {paymentErrors.amount ? (
                  <p className="text-xs text-red-600">{paymentErrors.amount}</p>
                ) : null}
              </div>

              {paymentMethod === "wallet" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      select your wallet
                    </label>
                    <div className="relative">
                      <select
                        value={paymentWalletProvider}
                        onChange={(e) => setPaymentWalletProvider(e.target.value)}
                        className={[
                          "min-h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-700 outline-none",
                          paymentErrors.walletProvider ? "border-red-300" : "border-zinc-200",
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
                    {paymentErrors.walletProvider ? (
                      <p className="text-xs text-red-600">{paymentErrors.walletProvider}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      enter wallet id
                    </label>
                    <input
                      value={paymentWalletId}
                      onChange={(e) => setPaymentWalletId(e.target.value)}
                      placeholder="Enter Wallet ID"
                      className={[
                        "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                        paymentErrors.walletId ? "border-red-300" : "border-zinc-200",
                      ].join(" ")}
                    />
                    {paymentErrors.walletId ? (
                      <p className="text-xs text-red-600">{paymentErrors.walletId}</p>
                    ) : null}
                  </div>
                </>
              ) : paymentMethod === "bank" ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    bank name
                  </label>
                  <input
                    value={paymentBankName}
                    onChange={(e) => setPaymentBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className={[
                      "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                      paymentErrors.bankName ? "border-red-300" : "border-zinc-200",
                    ].join(" ")}
                  />
                  {paymentErrors.bankName ? (
                    <p className="text-xs text-red-600">{paymentErrors.bankName}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  transaction no.
                </label>
                <input
                  value={paymentTxNo}
                  onChange={(e) => setPaymentTxNo(e.target.value)}
                  placeholder="Enter transaction no."
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    paymentErrors.transactionNo ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {paymentErrors.transactionNo ? (
                  <p className="text-xs text-red-600">{paymentErrors.transactionNo}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  upload screenshot
                </label>
                <div
                  className={[
                    "rounded-xl border bg-white px-4 py-7",
                    paymentErrors.screenshotUrl ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (!f) return;
                    try {
                      setPaymentSaving(true);
                      setPaymentScreenshotName(f.name);
                      const url = await uploadScreenshot(f);
                      setPaymentScreenshotUrl(url);
                      setPaymentErrors((prev) => {
                        const next = { ...prev };
                        delete next.screenshotUrl;
                        return next;
                      });
                    } catch (e) {
                      setPaymentMessage(e instanceof Error ? e.message : "Upload failed");
                    } finally {
                      setPaymentSaving(false);
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
                      id="admin-payment-screenshot"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setPaymentSaving(true);
                          setPaymentScreenshotName(f.name);
                          const url = await uploadScreenshot(f);
                          setPaymentScreenshotUrl(url);
                          setPaymentErrors((prev) => {
                            const next = { ...prev };
                            delete next.screenshotUrl;
                            return next;
                          });
                        } catch (e) {
                          setPaymentMessage(e instanceof Error ? e.message : "Upload failed");
                        } finally {
                          setPaymentSaving(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("admin-payment-screenshot")?.click()
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[0.99]"
                    >
                      Upload Document
                    </button>
                    {paymentScreenshotName ? (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {paymentScreenshotName}
                        {paymentScreenshotUrl ? " (uploaded)" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                {paymentErrors.screenshotUrl ? (
                  <p className="text-xs text-red-600">{paymentErrors.screenshotUrl}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={paymentSaving}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentSaving ? "Submitting…" : "Submit Deposit"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
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
        : isPendingReview(status)
          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${cls}`}
    >
      {statusDisplayLabel(status)}
    </span>
  );
}
