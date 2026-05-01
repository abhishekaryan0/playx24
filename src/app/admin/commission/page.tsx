"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminHeader } from "../_components/AdminHeader";

type TxRow = {
  id: string;
  type: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  amount: number | null;
  walletProvider: string | null;
  walletId: string | null;
  note: string | null;
  transactionNo: string | null;
  createdAt: string;
  updatedAt: string;
  user: { mobile: string } | null;
};

function TxStatusBadge({ status }: { status: TxRow["status"] }) {
  const cls =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80"
      : status === "DECLINED"
        ? "bg-red-100 text-red-900 ring-1 ring-red-200/80"
        : "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
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

function txDisplayId(tx: TxRow): string {
  const t = (tx.transactionNo ?? "").trim();
  if (t) return t;
  const id = (tx.id ?? "").trim();
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function AdminCommissionPage() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const openTx = useMemo(() => rows.find((r) => r.id === openId) ?? null, [openId, rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/transactions?type=USER_WITHDRAW");
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      const json = (await res.json().catch(() => null)) as
        | { transactions?: TxRow[]; error?: string }
        | null;
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setRows((json?.transactions ?? []) as TxRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: "APPROVED" | "DECLINED") {
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "Update failed");
      await load();
      setOpenId((cur) => (cur === id ? null : cur));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90">
      <AdminHeader
        title="Commission record"
        description="Withdraw requests submitted by users."
        maxWidth="wide"
        back={{ href: "/admin", label: "Back to admin" }}
        actions={
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-medium text-[#1b4332] shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
          >
            Refresh
          </button>
        }
      />

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_32px_rgba(27,67,50,0.08)] ring-1 ring-emerald-900/[0.04]">
          <div className="overflow-x-auto">
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
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-zinc-500">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                        Loading…
                      </span>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-zinc-500">
                      No withdraw requests yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const busy = actionId === r.id;
                    return (
                      <tr key={r.id} className="transition hover:bg-emerald-50/40">
                        <td className="px-5 py-4 text-xs text-zinc-700">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-700">
                          Commission withdraw
                          <span className="ml-2 text-[11px] text-zinc-400">
                            {r.user?.mobile ? `(${r.user.mobile})` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-semibold text-zinc-800">
                          {r.amount ? r.amount.toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-zinc-800">
                          {txDisplayId(r)}
                        </td>
                        <td className="px-5 py-4">
                          <TxStatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setOpenId(r.id)}
                              className="inline-flex h-8 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                              aria-label="View"
                            >
                              <EyeIcon />
                            </button>
                            {r.status === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setStatus(r.id, "APPROVED")}
                                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setStatus(r.id, "DECLINED")}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          Tip: you can also review applications on{" "}
          <Link href="/admin" className="text-emerald-700 hover:underline">
            Admin Applications
          </Link>
          .
        </p>
      </main>

      {openTx ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-6"
          onClick={() => setOpenId(null)}
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
                  value={openTx.walletProvider ?? ""}
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
                  value={openTx.walletId ?? ""}
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
                  value={openTx.amount ? String(openTx.amount) : ""}
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
                  value={openTx.note ?? ""}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none disabled:cursor-not-allowed"
                />
              </div>

              {openTx.status === "PENDING" ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={actionId === openTx.id}
                    onClick={() => setStatus(openTx.id, "APPROVED")}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <span aria-hidden="true">✓</span>
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionId === openTx.id}
                    onClick={() => setStatus(openTx.id, "DECLINED")}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    <span aria-hidden="true">×</span>
                    Decline
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-zinc-500">
                    Status: <b className="text-zinc-700">{openTx.status}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenId(null)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

