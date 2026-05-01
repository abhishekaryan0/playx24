"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { applicationTypeLabel } from "@/lib/application-type";
import { resolvePublicUploadUrl } from "@/lib/upload-url";
import { formatCommissionPercent, getCommissionTier } from "@/lib/commission-tier";
import type {
  ApiResponse,
  ApplicationDetail,
  DashboardTab,
  NotificationRow,
  TransactionRow,
} from "./_components/types";
import { downloadCsvStatement, isRecord } from "./_components/utils";
import {
  DashTab,
  FinanceRow,
  KeyValueRow,
  Section,
  StatCard,
  StatusPill,
  TierPill,
  TxStatusBadge,
} from "./_components/ui";

// (UI + types extracted into ./_components/*)

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
  const router = useRouter();
  const storageKey = useMemo(() => "play24x:auth:mobile", []);
  const [mobile, setMobile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [pushStatus, setPushStatus] = useState<
    "unsupported" | "default" | "granted" | "denied"
  >("default");

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

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawSaving, setWithdrawSaving] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawErrors, setWithdrawErrors] = useState<Record<string, string>>({});
  const [withdrawWalletProvider, setWithdrawWalletProvider] = useState("");
  const [withdrawWalletId, setWithdrawWalletId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");

  const [tab, setTab] = useState<
    "depositRequest" | "payRecord" | "commissionRecord" | "statement" | "profile"
  >("profile");

  const [commissionOpenId, setCommissionOpenId] = useState<string | null>(null);

  const [statementQuery, setStatementQuery] = useState("");
  const [statementDate, setStatementDate] = useState("");

  useEffect(() => {
    const m = window.localStorage.getItem(storageKey) ?? "";
    setMobile(m);
  }, [storageKey]);

  useEffect(() => {
    function syncTabFromUrl() {
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get("tab");
      if (
        next === "depositRequest" ||
        next === "payRecord" ||
        next === "commissionRecord" ||
        next === "statement" ||
        next === "profile"
      ) {
        setTab(next);
      }
    }
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus(Notification.permission as any);
  }, []);

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

  const loadNotifications = useCallback(async () => {
    if (!mobile) return;
    try {
      const res = await fetch(
        `/api/me/notifications?mobile=${encodeURIComponent(mobile)}`,
      );
      const json = (await res.json().catch(() => null)) as
        | { notifications?: NotificationRow[]; error?: string }
        | null;
      if (!res.ok) throw new Error(json?.error || "Failed to load notifications");
      const next = (json?.notifications ?? []) as NotificationRow[];
      setNotifications(next);

      const unread = next.find((n) => !n.readAt);
      if (unread) {
        setToast({ title: unread.title, message: unread.message });
        // Mark as read so it doesn't keep popping.
        await fetch(`/api/me/notifications/${unread.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile }),
        }).catch(() => {});
      }
    } catch {
      // Non-blocking
    }
  }, [mobile]);

  async function enablePush() {
    try {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) {
        setToast({
          title: "Not supported",
          message: "Push notifications are not supported on this device/browser.",
        });
        return;
      }
      if (!mobile) {
        setToast({
          title: "Login required",
          message: "Please login first to enable notifications.",
        });
        return;
      }
      if (!window.isSecureContext) {
        setToast({
          title: "HTTPS required",
          message: "Push notifications require HTTPS (or localhost).",
        });
        return;
      }

      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);
      if (permission !== "granted") {
        setToast({
          title: "Permission blocked",
          message:
            permission === "denied"
              ? "Please allow notifications in your browser settings."
              : "Notification permission was not granted.",
        });
        return;
      }

      const swReg = await navigator.serviceWorker.register("/sw.js");

      const pkRes = await fetch("/api/me/push/public-key");
      const pkJson = (await pkRes.json().catch(() => null)) as
        | { publicKey?: string; error?: string }
        | null;
      if (!pkRes.ok || !pkJson?.publicKey) {
        setToast({
          title: "Push not configured",
          message: pkJson?.error || "Missing VAPID keys on server.",
        });
        return;
      }

      const appServerKey = urlBase64ToUint8Array(pkJson.publicKey);
      const existing = await swReg.pushManager.getSubscription();
      const sub =
        existing ||
        (await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        }));

      const resp = await fetch("/api/me/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });
      const rj = (await resp.json().catch(() => null)) as { error?: string } | null;
      if (!resp.ok) {
        setToast({
          title: "Failed",
          message: rj?.error || "Could not save subscription.",
        });
        return;
      }

      setToast({
        title: existing ? "Already enabled" : "Enabled",
        message: "Push notifications are enabled on this device.",
      });
    } catch (e: unknown) {
      setToast({
        title: "Failed",
        message: e instanceof Error ? e.message : "Could not enable notifications.",
      });
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    if (!mobile) return;
    loadTransactions();
  }, [loadTransactions, mobile]);

  useEffect(() => {
    if (!mobile) return;
    loadNotifications();
    const id = window.setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadNotifications, mobile]);

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

  const depositRequests = useMemo(
    () => tx.filter((t) => t.type === "ADMIN_DEPOSIT"),
    [tx],
  );

  const payRecords = useMemo(
    () => tx.filter((t) => t.type === "USER_DEPOSIT"),
    [tx],
  );

  const commissionRecords = useMemo(
    () => tx.filter((t) => t.type === "USER_WITHDRAW"),
    [tx],
  );

  const openCommissionTx = useMemo(
    () => (commissionOpenId ? tx.find((t) => t.id === commissionOpenId) ?? null : null),
    [commissionOpenId, tx],
  );

  const statementRows = useMemo(
    () => filteredTx.filter((t) => t.status === "APPROVED"),
    [filteredTx],
  );

  const statementTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const t of statementRows) {
      const amt = typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
      if (t.type === "ADMIN_DEPOSIT" || t.type === "USER_WITHDRAW") totalOut += amt;
      else totalIn += amt;
    }
    const balance = totalIn - totalOut;
    return { totalIn, totalOut, balance };
  }, [statementRows]);

  const finance = useMemo(() => {
    const approved = tx.filter((t) => t.status === "APPROVED");
    const cashIn = approved
      .filter((t) => t.type === "USER_DEPOSIT")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const cashOut = approved
      .filter((t) => t.type === "ADMIN_DEPOSIT" || t.type === "USER_WITHDRAW")
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
      const withdrawal = t.type === "ADMIN_DEPOSIT" || t.type === "USER_WITHDRAW" ? amt : 0;
      const deposit = t.type === "USER_DEPOSIT" ? amt : 0;
      running += deposit - withdrawal;
      return { t, withdrawal, deposit, running };
    });
  }, [statementRows]);

  async function respondToAdminDeposit(id: string, next: "APPROVED" | "DECLINED") {
    try {
      const res = await fetch(`/api/me/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, status: next }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "Update failed");
      await loadTransactions();
    } catch (e: unknown) {
      setTxError(isRecord(e) && typeof e.message === "string" ? e.message : "Update failed");
    }
  }

  function EyeIcon({ className }: { className?: string }) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90 pb-16">
      <AdminHeader
        maxWidth="wide"
        title="Applications"
        description="Full submission including documents and linked account."
        back={{ href: "/", label: "Back to login" }}
        actions={
          mobile ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="font-mono text-xs text-zinc-500">{mobile}</span>
              <span className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    if (pushStatus === "granted") {
                      router.push("/my-application/notifications");
                      return;
                    }
                    enablePush();
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50"
                  aria-label="Enable push notifications"
                  title={
                    pushStatus === "granted"
                      ? "Push enabled"
                      : pushStatus === "denied"
                        ? "Push blocked in browser settings"
                        : "Enable push notifications"
                  }
                >
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
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
                {notifications.some((n) => !n.readAt) ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
                ) : null}
              </span>
              <TierPill
                tierLabel={finance.tier.label}
                pillClassName={finance.tier.pillClassName}
                iconClassName={finance.tier.iconClassName}
                tooltipImageSrc="/images/commistion_tier.png"
              />
              {appStatus ? <StatusPill status={appStatus} /> : null}
            </div>
          ) : null
        }
      />

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
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
                active={tab === "commissionRecord"}
                onClick={() => setTab("commissionRecord")}
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
                    <path d="M12 2v20" />
                    <path d="M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3 3 0 0 1 0 6H6" />
                  </svg>
                }
              >
                Commission Record
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
                <span className="inline-flex items-center gap-2">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md bg-white/15"
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
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                  Add Payment
                </span>
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
                <p className="text-sm text-zinc-600">
                  Admin submitted deposits will appear here. You can accept or reject.
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
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-zinc-500"
                          >
                            Loading…
                          </td>
                        </tr>
                      ) : depositRequests.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-zinc-500"
                          >
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
                            <td className="px-4 py-3 text-right">
                              {t.status === "PENDING" ? (
                                <div className="inline-flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => respondToAdminDeposit(t.id, "APPROVED")}
                                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => respondToAdminDeposit(t.id, "DECLINED")}
                                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
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

            {tab === "payRecord" ? (
              <Section title="Pay record">
                <p className="text-sm text-zinc-600">
                  Your submitted deposits (pending/approved/declined).
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {txLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                            Loading…
                          </td>
                        </tr>
                      ) : payRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                            No pay records yet.
                          </td>
                        </tr>
                      ) : (
                        payRecords.map((t) => (
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

            {tab === "commissionRecord" ? (
              <Section title="Commission record">
                <p className="text-sm text-zinc-600">
                  Your withdraw requests (pending/approved/declined).
                </p>

                {txError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {txError}
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-emerald-900/10">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Description</th>
                        <th className="px-5 py-4 text-right">Amount</th>
                        <th className="px-5 py-4">Transaction ID</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {txLoading ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-14 text-center text-zinc-500">
                            Loading…
                          </td>
                        </tr>
                      ) : commissionRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-14 text-center text-zinc-500">
                            No commission records yet.
                          </td>
                        </tr>
                      ) : (
                        commissionRecords.map((t) => (
                          <tr key={t.id} className="hover:bg-emerald-50/40">
                            <td className="px-5 py-4 text-xs text-zinc-700">
                              {new Date(t.createdAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-xs text-zinc-700">
                              Commission withdraw
                            </td>
                            <td className="px-5 py-4 text-right text-xs font-semibold text-zinc-800">
                              {t.amount ? t.amount.toLocaleString() : "—"}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-zinc-800">
                              {t.transactionNo ??
                                (t.id.length <= 10
                                  ? t.id
                                  : `${t.id.slice(0, 6)}…${t.id.slice(-4)}`)}
                            </td>
                            <td className="px-5 py-4">
                              <TxStatusBadge status={t.status} />
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setCommissionOpenId(t.id)}
                                className="inline-flex h-8 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                                aria-label="View"
                              >
                                <EyeIcon />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            ) : null}

            {tab === "statement" ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard
                      title="Commission"
                      value="0"
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
                      value={statementTotals.totalIn.toLocaleString()}
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
                      value={`- ${statementTotals.totalOut.toLocaleString()}`}
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
                      value={statementTotals.balance.toLocaleString()}
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
                      onClick={() => downloadCsvStatement(mobile, statementRows)}
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
                        {statementTableRows.map(({ t, withdrawal, deposit, running }) => (
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
                        ))}
                        {statementTableRows.length === 0 ? (
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
                  <FinanceRow
                    label="Commission:"
                    value={finance.commission.toLocaleString()}
                  />
                  <FinanceRow label="Cash In:" value={finance.cashIn.toLocaleString()} />
                  <FinanceRow label="Cash Out:" value={finance.cashOut.toLocaleString()} />
                  <FinanceRow label="Balance:" value={finance.balance.toLocaleString()} />
                  <FinanceRow
                    label="ACT"
                    helper="(Average Confirmation Time)"
                    value={formatAct(finance.actSeconds)}
                  />

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawMessage(null);
                        setWithdrawErrors({});
                        const wProvider = application.walletDetails?.provider ?? "";
                        const wId = application.walletDetails?.walletId ?? "";
                        setWithdrawWalletProvider(wProvider);
                        setWithdrawWalletId(wId);
                        setWithdrawAmount(String(Math.max(0, finance.commission)));
                        setWithdrawNote("");
                        setWithdrawOpen(true);
                      }}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      Withdraw
                    </button>
                  </div>
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
              className="max-h-[78vh] overflow-auto space-y-4 px-5 py-5"
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
                  setToast({
                    title: "Submitted",
                    message: "Your deposit request has been submitted.",
                  });
                  setTab("payRecord");
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

      {withdrawOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setWithdrawOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border border-zinc-200 border-b-0 bg-white shadow-2xl sm:rounded-2xl sm:border-b"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Withdraw request
              </p>
            </div>

            <form
              className="max-h-[78vh] overflow-auto space-y-4 px-5 py-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setWithdrawMessage(null);
                setWithdrawErrors({});
                setWithdrawSaving(true);
                try {
                  const amount = Number(withdrawAmount);
                  const res = await fetch("/api/me/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mobile,
                      kind: "USER_WITHDRAW",
                      amount,
                      walletProvider: withdrawWalletProvider,
                      walletId: withdrawWalletId,
                      note: withdrawNote,
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
                    setWithdrawErrors(json?.fieldErrors ?? {});
                    throw new Error(json?.error || "Submit failed");
                  }

                  setWithdrawOpen(false);
                  await loadTransactions();
                  setToast({
                    title: "Requested",
                    message: "Your withdraw request has been submitted.",
                  });
                } catch (err: unknown) {
                  const msg =
                    isRecord(err) && typeof err.message === "string"
                      ? err.message
                      : "Submit failed";
                  setWithdrawMessage(msg);
                } finally {
                  setWithdrawSaving(false);
                }
              }}
            >
              {withdrawMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {withdrawMessage}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Total commission
                </label>
                <input
                  disabled
                  value={finance.commission.toLocaleString()}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Ready to withdraw
                </label>
                <input
                  disabled
                  value={Math.max(0, finance.commission).toLocaleString()}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Wallet
                </label>
                <div className="relative">
                  <select
                    value={withdrawWalletProvider}
                    onChange={(e) => setWithdrawWalletProvider(e.target.value)}
                    className={[
                      "min-h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-700 outline-none",
                      withdrawErrors.walletProvider ? "border-red-300" : "border-zinc-200",
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
                {withdrawErrors.walletProvider ? (
                  <p className="text-xs text-red-600">{withdrawErrors.walletProvider}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Wallet ID
                </label>
                <input
                  value={withdrawWalletId}
                  onChange={(e) => setWithdrawWalletId(e.target.value)}
                  placeholder="Enter wallet id"
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    withdrawErrors.walletId ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {withdrawErrors.walletId ? (
                  <p className="text-xs text-red-600">{withdrawErrors.walletId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Amount
                </label>
                <input
                  inputMode="numeric"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={[
                    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none",
                    withdrawErrors.amount ? "border-red-300" : "border-zinc-200",
                  ].join(" ")}
                />
                {withdrawErrors.amount ? (
                  <p className="text-xs text-red-600">{withdrawErrors.amount}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Remarks
                </label>
                <input
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Add a remark"
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="submit"
                  disabled={withdrawSaving}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {withdrawSaving ? "Submitting…" : "Withdraw Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {openCommissionTx ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setCommissionOpenId(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-zinc-200 border-b-0 bg-white shadow-2xl sm:rounded-2xl sm:border-b"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Withdraw request
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Wallet
                </label>
                <input
                  disabled
                  value={openCommissionTx.walletProvider ?? ""}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Wallet ID
                </label>
                <input
                  disabled
                  value={openCommissionTx.walletId ?? ""}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Amount
                </label>
                <input
                  disabled
                  value={openCommissionTx.amount ? String(openCommissionTx.amount) : ""}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Remarks
                </label>
                <input
                  disabled
                  value={openCommissionTx.note ?? ""}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-500">
                  Status: <b className="text-zinc-700">{openCommissionTx.status}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setCommissionOpenId(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_18px_50px_rgba(27,67,50,0.18)] ring-1 ring-emerald-900/[0.04]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
              <p className="mt-1 text-sm text-zinc-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// (moved to ./_components/*)

