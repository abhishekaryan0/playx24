"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import type { NotificationRow } from "../_components/types";

export default function MyNotificationsPage() {
  const storageKey = useMemo(() => "play24x:auth:mobile", []);
  const [mobile, setMobile] = useState<string>("");
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const m = window.localStorage.getItem(storageKey) ?? "";
    setMobile(m);
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!mobile) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/me/notifications?mobile=${encodeURIComponent(mobile)}`,
        );
        const json = (await res.json().catch(() => null)) as
          | { notifications?: NotificationRow[]; error?: string }
          | null;
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        if (!cancelled) setRows((json?.notifications ?? []) as NotificationRow[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [mobile]);

  async function markRead(id: string) {
    if (!mobile) return;
    await fetch(`/api/me/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    }).catch(() => {});
    setRows((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90 pb-16">
      <AdminHeader
        maxWidth="wide"
        title="Notifications"
        description="All your updates in one place."
        back={{ href: "/my-application", label: "Back to dashboard" }}
        actions={
          mobile ? <span className="font-mono text-xs text-zinc-500">{mobile}</span> : null
        }
      />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-8 sm:px-6">
        {!mobile ? (
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Please login first.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(27,67,50,0.06)] ring-1 ring-emerald-900/[0.03]">
          <div className="border-b border-emerald-900/10 bg-[#1b4332]/[0.05] px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1b4332]">
              Latest
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              rows.map((n) => {
                const unread = !n.readAt;
                const href =
                  n.kind === "ADMIN_DEPOSIT_CREATED"
                    ? "/my-application?tab=depositRequest"
                    : "/my-application";
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => markRead(n.id)}
                    className={[
                      "block px-5 py-4 transition",
                      unread ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">{n.title}</p>
                        <p className="mt-1 text-sm text-zinc-600">{n.message}</p>
                        <p className="mt-2 text-xs text-zinc-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {unread ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600 ring-2 ring-white" />
                      ) : null}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

