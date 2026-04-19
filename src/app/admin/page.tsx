"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isPendingReview, statusDisplayLabel } from "@/lib/application-status";

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

  const loadApplications = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.status === 401) {
        setAuthed(false);
        setRows([]);
        return;
      }
      if (!res.ok) {
        setListError("Failed to load applications");
        return;
      }
      const data = (await res.json()) as { applications: ApplicationRow[] };
      setRows(data.applications ?? []);
    } catch {
      setListError("Failed to load applications");
    } finally {
      setListLoading(false);
    }
  }, []);

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-zinc-100 px-4 py-16">
        <div className="mx-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Admin login</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in with the configured username and password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700" htmlFor="user">
                Username
              </label>
              <input
                id="user"
                autoComplete="username"
                className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none ring-emerald-600/20 focus:ring-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700" htmlFor="pass">
                Password
              </label>
              <input
                id="pass"
                type="password"
                autoComplete="current-password"
                className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none ring-emerald-600/20 focus:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError ? (
              <p className="text-sm text-red-600">{loginError}</p>
            ) : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="h-10 w-full rounded-md bg-emerald-800 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Applications — Admin
            </h1>
            <p className="text-xs text-zinc-500">
              Review submissions and approve or reject.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadApplications()}
              disabled={listLoading}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {listError ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {listError}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">View / actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
                  const mobile = r.mobileNumber ?? r.user?.mobile ?? "—";
                  const busy = actionId === r.id;
                  const canDecide = isPendingReview(r.status);
                  return (
                    <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{name}</div>
                        <div className="text-xs text-zinc-400">{r.id.slice(0, 12)}…</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{r.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-800">{mobile}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {new Date(r.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/applications/${r.id}`}
                            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                          >
                            View
                          </Link>
                          {canDecide ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStatus(r.id, "APPROVED")}
                                className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStatus(r.id, "REJECTED")}
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
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
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-emerald-100 text-emerald-900"
      : s === "REJECTED"
        ? "bg-red-100 text-red-900"
        : isPendingReview(status)
          ? "bg-amber-100 text-amber-900"
          : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {statusDisplayLabel(status)}
    </span>
  );
}
