"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { applicationTypeLabel } from "@/lib/application-type";
import { isPendingReview, statusDisplayLabel } from "@/lib/application-status";
import { AdminHeader } from "./_components/AdminHeader";
import { IconLogout, IconRefresh } from "./_components/AdminIcons";
import { AdminLoginShell } from "./_components/AdminLoginShell";

type ApplicationRow = {
  id: string;
  type: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  mobileNumber: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  user: { mobile: string } | null;
};

type ListResponse = {
  applications: ApplicationRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function AdminPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "APPROVED" | "REJECTED" | "PENDING" | "DRAFT"
  >("ALL");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(total, page * pageSize);

  const loadApplications = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      if (res.status === 401) {
        setAuthed(false);
        setRows([]);
        return;
      }
      if (!res.ok) {
        setListError("Failed to load applications");
        return;
      }
      const data = (await res.json()) as ListResponse;
      setRows(data.applications ?? []);
      setPage(data.page ?? 1);
      setPageSize(data.pageSize ?? pageSize);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setListError("Failed to load applications");
    } finally {
      setListLoading(false);
    }
  }, [from, page, pageSize, q, statusFilter, to]);

  useEffect(() => {
    if (!authed) return;
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, page, pageSize, statusFilter, from, to, q]);

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, bootstrapRes] = await Promise.all([
          fetch("/api/admin/session"),
          fetch("/api/admin/bootstrap"),
        ]);
        const sessionData = (await sessionRes.json()) as { ok?: boolean };
        if (bootstrapRes.ok) {
          const boot = (await bootstrapRes.json()) as { username?: string };
          setUsername(boot.username?.trim() || "admin");
        } else {
          setUsername("admin");
        }
        setAuthed(Boolean(sessionData.ok));
        if (sessionData.ok) await loadApplications();
      } finally {
        setSessionChecked(true);
      }
    })();
  }, [loadApplications]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLoginError(data.error ?? "Login failed");
        return;
      }
      setAuthed(true);
      setPassword("");
      await loadApplications();
    } catch {
      setLoginError("Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRows([]);
  }

  async function setStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "PENDING",
  ) {
    setActionId(id);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setListError(data.error ?? "Update failed");
        return;
      }
      await loadApplications();
    } catch {
      setListError("Update failed");
    } finally {
      setActionId(null);
    }
  }

  if (!sessionChecked) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-gradient-to-b from-emerald-50/50 via-white to-zinc-50">
        <Image
          src="/images/play24x-logo.png"
          alt="Play24X"
          width={140}
          height={56}
          priority
          className="h-12 w-auto opacity-90"
        />
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-[#1b4332]"
          aria-hidden
        />
        <p className="text-sm text-zinc-500">Loading admin…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLoginShell>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-[0_12px_40px_rgba(27,67,50,0.1)] ring-1 ring-emerald-900/[0.06]">
          <div className="mb-8 flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-600/15">
              <Image
                src="/images/frame.png"
                alt=""
                width={30}
                height={30}
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Admin sign in
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Play24X operations — secure access only
              </p>
            </div>
          </div>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-zinc-700"
                htmlFor="user"
              >
                Username
              </label>
              <input
                id="user"
                autoComplete="username"
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-600/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-zinc-700"
                htmlFor="pass"
              >
                Password
              </label>
              <input
                id="pass"
                type="password"
                autoComplete="current-password"
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-600/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {loginError}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="h-11 w-full rounded-lg bg-emerald-800 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-zinc-400">
            <Link href="/" className="text-emerald-700 hover:underline">
              ← Back to site
            </Link>
          </p>
        </div>
      </AdminLoginShell>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90">
      <AdminHeader
        title="Applications"
        description="Review agent submissions — approve, reject, or open full details."
        maxWidth="wide"
        actions={
          <>
            <button
              type="button"
              onClick={() => loadApplications()}
              disabled={listLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-medium text-[#1b4332] shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
            >
              <IconRefresh className="text-emerald-700" />
              Refresh
            </button>
            <Link
              href="/admin/commission"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:bg-emerald-50"
            >
              Commission record
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1b4332] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142f24]"
            >
              <IconLogout className="text-white/90" />
              Log out
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
          <div className="h-1 bg-gradient-to-r from-emerald-200/80 via-emerald-100 to-transparent" />
          <div className="bg-gradient-to-b from-emerald-50/70 to-white px-3 py-3 sm:px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
              <StatusTab
                active={statusFilter === "APPROVED"}
                onClick={() => {
                  setStatusFilter("APPROVED");
                  setPage(1);
                }}
              >
                Approved
              </StatusTab>
              <StatusTab
                active={statusFilter === "REJECTED"}
                onClick={() => {
                  setStatusFilter("REJECTED");
                  setPage(1);
                }}
              >
                Rejected
              </StatusTab>
              <StatusTab
                active={statusFilter === "PENDING"}
                onClick={() => {
                  setStatusFilter("PENDING");
                  setPage(1);
                }}
              >
                Pending
              </StatusTab>
              <StatusTab
                active={statusFilter === "DRAFT"}
                onClick={() => {
                  setStatusFilter("DRAFT");
                  setPage(1);
                }}
              >
                Draft
              </StatusTab>
            </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:flex lg:items-center lg:justify-end">
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
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search agent…"
                    className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm font-medium text-zinc-700 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-600/20 lg:w-[320px]"
                    aria-label="Search agent"
                  />
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <DateChip
                    label="From :"
                    value={from}
                    onChange={(v) => {
                      setFrom(v);
                      setPage(1);
                    }}
                    ariaLabel="From date"
                  />
                  <DateChip
                    label="To :"
                    value={to}
                    onChange={(v) => {
                      setTo(v);
                      setPage(1);
                    }}
                    ariaLabel="To date"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {listError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm">
            {listError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_32px_rgba(27,67,50,0.08)] ring-1 ring-emerald-900/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-900/10 bg-[#1b4332]/[0.06] text-xs font-semibold uppercase tracking-wide text-[#1b4332]">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Mobile</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {listLoading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-zinc-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                        Loading applications…
                      </span>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-zinc-500"
                    >
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const name =
                      [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
                      "—";
                    const mobile = r.mobileNumber ?? r.user?.mobile ?? "—";
                    const busy = actionId === r.id;
                    const canDecide = isPendingReview(r.status);
                    return (
                      <tr
                        key={r.id}
                        className="transition hover:bg-emerald-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900">
                            {name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-800">
                          {applicationTypeLabel(r.type)}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-zinc-800">
                          {mobile}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-500">
                          {new Date(r.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`/admin/applications/${r.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1b4332] shadow-sm transition hover:bg-emerald-50"
                            >
                              View
                            </Link>
                            {canDecide ? (
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
                                  onClick={() => setStatus(r.id, "REJECTED")}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
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

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Showing <span className="font-medium text-zinc-700">{showingFrom}</span>
            {" - "}
            <span className="font-medium text-zinc-700">{showingTo}</span> of{" "}
            <span className="font-medium text-zinc-700">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none"
              aria-label="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <button
                type="button"
                disabled={page <= 1 || listLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Prev
              </button>
              <div className="grid h-9 place-items-center border-x border-zinc-200 px-3 text-xs text-zinc-500">
                {page} / {totalPages}
              </div>
              <button
                type="button"
                disabled={page >= totalPages || listLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusTab({
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
        "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-medium shadow-sm transition",
        active
          ? "border-emerald-200 bg-emerald-50 text-[#1b4332]"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DateChip({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm">
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-5 w-[8.25rem] bg-transparent text-xs text-zinc-700 outline-none"
        aria-label={ariaLabel}
      />
      <span className="text-zinc-400" aria-hidden="true">
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
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      </span>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {statusDisplayLabel(status)}
    </span>
  );
}
