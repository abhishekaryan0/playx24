"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { applicationTypeLabel } from "@/lib/application-type";
import {
  isPendingReview,
  statusDisplayLabel,
} from "@/lib/application-status";
import { AdminHeader } from "../../_components/AdminHeader";

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
  user: { id: string; mobile: string; createdAt: string } | null;
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
  if (!url) {
    return <p className="text-sm text-zinc-400">Not uploaded</p>;
  }
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
      >
        Open PDF document
      </a>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      className="max-h-72 max-w-full rounded-lg border border-zinc-200 bg-zinc-50 object-contain"
    />
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

export default function AdminApplicationViewPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        maxWidth="4xl"
        title="Application details"
        description="Full submission including documents and linked account."
        back={{ href: "/admin", label: "Back to applications" }}
        meta={
          <p className="font-mono text-[11px] text-zinc-400">{app.id}</p>
        }
        actions={
          <>
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
        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {loadError}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Section title="Overview">
          <Field label="Applicant" value={name} />
          <Field label="Type" value={applicationTypeLabel(app.type)} />
          <Field
            label="Status"
            value={statusDisplayLabel(app.status)}
          />
          <Field
            label="Created"
            value={new Date(app.createdAt).toLocaleString()}
          />
          <Field
            label="Updated"
            value={new Date(app.updatedAt).toLocaleString()}
          />
          {app.user ? (
            <Field
              label="Linked user mobile"
              value={<span className="font-mono">{app.user.mobile}</span>}
            />
          ) : null}
        </Section>

        <Section title="Primary information">
          <Field label="Address" value={app.address} />
          <Field label="Country" value={countryLabel(app.country)} />
          <Field
            label="Whatsapp"
            value={<span className="font-mono">{app.whatsappNumber}</span>}
          />
          <Field
            label="Mobile"
            value={<span className="font-mono">{app.mobileNumber}</span>}
          />
          <Field label="Telegram" value={app.telegramId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Document</p>
              <MediaBlock url={app.documentUrl} label="Document" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">
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
                <Field label="Account number" value={app.bankDetails.accountNumber} />
                <Field label="IFSC" value={app.bankDetails.ifscCode} />
                <Field label="Bank name" value={app.bankDetails.bankName} />
                <Field label="Holder name" value={app.bankDetails.holderName} />
                <Field label="Branch" value={app.bankDetails.branchName} />
              </Section>
            ) : null}
            {app.walletDetails ? (
              <Section title="Wallet details">
                <Field label="Provider" value={app.walletDetails.provider} />
                <Field
                  label="Wallet / UPI"
                  value={app.walletDetails.walletId}
                />
              </Section>
            ) : null}
          </>
        ) : null}

        {app.type === "AGENT" && app.platformDetails ? (
          <Section title="Platform details">
            <Field label="Platform name" value={app.platformDetails.platformName} />
            <Field label="Platform link" value={app.platformDetails.platformLink} />
            <Field label="Users (range)" value={app.platformDetails.usersRange} />
            <Field
              label="Turnover (range)"
              value={app.platformDetails.turnoverRange}
            />
          </Section>
        ) : null}

        {app.brandRelation ? (
          <Section title="Brand relation">
            <Field
              label="Username in platform"
              value={app.brandRelation.usernameInPlatform}
            />
            <Field
              label="Previous transaction"
              value={
                app.brandRelation.hadPreviousTransaction === null
                  ? "—"
                  : app.brandRelation.hadPreviousTransaction
                    ? "Yes"
                    : "No"
              }
            />
            <Field
              label="Transaction ID"
              value={app.brandRelation.transactionId}
            />
          </Section>
        ) : null}
      </main>
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
