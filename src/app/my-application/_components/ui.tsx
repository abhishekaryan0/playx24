"use client";

import { useState } from "react";
import type { TransactionRow } from "./types";

export function Section({
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

export function KeyValueRow({
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

export function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80"
      : s === "REJECTED" || s === "DECLINED"
        ? "bg-red-100 text-red-900 ring-1 ring-red-200/80"
        : s === "PENDING"
          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80";
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${cls}`}>
      {status || "UNKNOWN"}
    </span>
  );
}

export function TxStatusBadge({ status }: { status: TransactionRow["status"] }) {
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

export function DashTab({
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

export function FinanceRow({
  label,
  helper,
  value,
}: {
  label: string;
  helper?: string;
  value: string;
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
        value={value}
        readOnly
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-300 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export function TierPill({
  tierLabel,
  pillClassName,
  iconClassName,
  tooltipImageSrc,
}: {
  tierLabel: string;
  pillClassName: string;
  iconClassName: string;
  tooltipImageSrc?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <span
        tabIndex={tooltipImageSrc ? 0 : undefined}
        role={tooltipImageSrc ? "button" : undefined}
        aria-haspopup={tooltipImageSrc ? "dialog" : undefined}
        aria-expanded={tooltipImageSrc ? open : undefined}
        onClick={
          tooltipImageSrc
            ? () => {
                setOpen((v) => !v);
              }
            : undefined
        }
        onKeyDown={
          tooltipImageSrc
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }
            : undefined
        }
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm outline-none",
          tooltipImageSrc ? "cursor-help focus:ring-2 focus:ring-emerald-600/30" : "",
          pillClassName,
        ].join(" ")}
        title={tooltipImageSrc ? "Click to view tier chart" : undefined}
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

      {tooltipImageSrc && open ? (
        <div
          role="dialog"
          aria-modal="false"
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          {/* Image only (no frame, no dark bg) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tooltipImageSrc}
            alt="Commission tier chart"
            className="max-h-[85vh] w-auto max-w-[min(980px,95vw)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </span>
  );
}

export function StatCard({
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

