"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  const application = data?.application ?? undefined;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/35 via-white to-zinc-50/90 pb-16">
      <AdminHeader
        maxWidth="4xl"
        title="Thank you"
        description="Your application details and status are shown below."
        back={{ href: "/", label: "Back to login" }}
        actions={
          mobile ? <span className="font-mono text-xs text-zinc-500">{mobile}</span> : null
        }
      />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
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
          </>
        )}
      </main>
    </div>
  );
}

