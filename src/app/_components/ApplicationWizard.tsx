"use client";

import { useEffect, useMemo, useState } from "react";
import {
  combineDialAndLocal,
  DEFAULT_PHONE_DIAL,
  digitsOnly,
  PHONE_DIAL_CODES,
} from "@/lib/phone";
import { ApplicationHeader } from "./ApplicationHeader";
import { StepsSidebar, type WizardStep } from "./StepsSidebar";

type PatchApplicationResponse = {
  id?: string;
  credentials?: { mobile?: string; password?: string };
};

function getErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
    return e.message;
  }
  return "Failed to save";
}

function getFieldErrors(e: unknown): Record<string, string> | undefined {
  if (!e || typeof e !== "object" || !("fieldErrors" in e)) return undefined;
  const fe = (e as { fieldErrors?: unknown }).fieldErrors;
  if (!fe || typeof fe !== "object") return undefined;
  return fe as Record<string, string>;
}

export function ApplicationWizard({
  headerHighlightText,
  headerSuffixText,
  variant = "walletBank",
  headerActions,
}: {
  headerHighlightText: string;
  headerSuffixText: string;
  variant?: "walletBank" | "agent";
  headerActions?: React.ReactNode;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<{
    open: boolean;
    kind: "success" | "error";
    message: string;
    mobile?: string;
    password?: string;
  }>({ open: false, kind: "success", message: "" });

  const step2PanelTitle =
    variant === "agent" ? "Platform Details" : "Bank & Wallet Details";
  const step3PanelTitle = "Brand Relation Details";

  const storageKey = useMemo(
    () => `play24x:applicationId:${variant}`,
    [variant],
  );

  useEffect(() => {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) setApplicationId(existing);
  }, [storageKey]);

  async function ensureApplication() {
    if (applicationId) return applicationId;
    const type = variant === "agent" ? "AGENT" : "WALLET_BANK_AGENT";
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error("Failed to start application");
    const data = (await res.json()) as { id: string };
    window.localStorage.setItem(storageKey, data.id);
    setApplicationId(data.id);
    return data.id;
  }

  async function patchApplication(patch: unknown) {
    const id = await ensureApplication();
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string; fieldErrors?: Record<string, string> }
        | null;
      const message = data?.error ?? "Failed to save";
      throw Object.assign(new Error(message), {
        fieldErrors: data?.fieldErrors,
      });
    }
    return (await res.json().catch(() => ({}))) as PatchApplicationResponse;
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--app-bg)]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[1200px] bg-[var(--app-surface)] pb-[max(0.5rem,var(--safe-bottom))]">
        <ApplicationHeader
          highlightText={headerHighlightText}
          suffixText={headerSuffixText}
          actions={headerActions}
        />

        <div className="grid gap-6 px-4 pb-10 pt-4 sm:gap-8 sm:px-6 sm:pb-14 sm:pt-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:px-10">
          <StepsSidebar
            step={step}
            onStepChange={setStep}
            labels={{
              step1: "Primary Info",
              step2:
                variant === "agent"
                  ? "Platform Details"
                  : "Bank and wallet details",
              step3: "Brand relation",
            }}
          />

          <main>
            <div className="rounded-none border border-zinc-200 bg-[var(--app-surface)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:rounded-xl">
              <div className="border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p className="text-sm font-semibold text-emerald-700">
                    {step === 1
                      ? "Primary Info"
                      : step === 2
                        ? step2PanelTitle
                        : step3PanelTitle}
                  </p>
                  {applicationId ? (
                    <span className="shrink-0 text-xs text-zinc-400">
                      Application ID: {applicationId.slice(0, 8)}…
                    </span>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="border-b border-zinc-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
                  {error}
                </div>
              ) : null}

              {step === 1 ? (
                <PrimaryInfoStep
                  saving={saving}
                  onContinue={async (values) => {
                    try {
                      setError(null);
                      setSaving(true);
                      await patchApplication({ primaryInfo: values });
                      setStep(2);
                    } catch (e: unknown) {
                      const fe = getFieldErrors(e);
                      if (fe && Object.keys(fe).length) {
                        setError(Object.values(fe).join(", "));
                      } else {
                        setError(getErrorMessage(e));
                      }
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              ) : step === 2 ? (
                variant === "agent" ? (
                  <PlatformDetailsStep
                    saving={saving}
                    onContinue={async (values) => {
                      try {
                        setError(null);
                        setSaving(true);
                        await patchApplication({ platformDetails: values });
                        setStep(3);
                      } catch (e: unknown) {
                        setError(getErrorMessage(e));
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                ) : (
                  <BankWalletStep
                    saving={saving}
                    onContinue={async (values) => {
                      try {
                        setError(null);
                        setSaving(true);
                        await patchApplication(values);
                        setStep(3);
                      } catch (e: unknown) {
                        setError(getErrorMessage(e));
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                )
              ) : (
                <BrandRelationStep
                  saving={saving}
                  onSubmit={async (values) => {
                    try {
                      setError(null);
                      setSaving(true);
                      const result = await patchApplication({
                        brandRelation: values,
                        status: "PENDING",
                      });

                      // Once submitted, drop the local draft so the next application starts fresh.
                      window.localStorage.removeItem(storageKey);
                      setApplicationId(null);

                      setSubmitModal({
                        open: true,
                        kind: "success",
                        message:
                          "Your application has been submitted successfully. Please note this.",
                        mobile: result.credentials?.mobile,
                        password: result.credentials?.password,
                      });
                    } catch (e: unknown) {
                      const msg = getErrorMessage(e) || "Submission failed";
                      setError(msg);
                      setSubmitModal({
                        open: true,
                        kind: "error",
                        message: msg,
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {submitModal.open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6"
          onClick={() => setSubmitModal((s) => ({ ...s, open: false }))}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-zinc-200 border-b-0 bg-white p-5 shadow-xl sm:rounded-xl sm:border-b sm:p-6"
            style={{
              paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "grid h-10 w-10 place-items-center rounded-full",
                  submitModal.kind === "success"
                    ? "bg-emerald-600/10 text-emerald-700"
                    : "bg-red-600/10 text-red-700",
                ].join(" ")}
                aria-hidden="true"
              >
                {submitModal.kind === "success" ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-base font-semibold text-zinc-900">
                  {submitModal.kind === "success"
                    ? "Submission successful"
                    : "Submission failed"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {submitModal.message}
                </p>

                {submitModal.kind === "success" &&
                submitModal.mobile &&
                submitModal.password ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-800">
                      Login details
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-emerald-900">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-800/80">Mobile</span>
                        <span className="font-mono">{submitModal.mobile}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-800/80">Password</span>
                        <span className="font-mono">{submitModal.password}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubmitModal((s) => ({ ...s, open: false }))}
                className="inline-flex min-h-11 min-w-[6rem] items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.99]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PrimaryInfoValues = {
  firstName?: string;
  lastName?: string;
  address?: string;
  country?: string;
  whatsappNumber?: string;
  mobileNumber?: string;
  telegramId?: string;
  documentUrl?: string;
  profilePicUrl?: string;
};

function PrimaryInfoStep({
  saving,
  onContinue,
}: {
  saving: boolean;
  onContinue: (values: PrimaryInfoValues) => void | Promise<void>;
}) {
  const [accepted, setAccepted] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-6 p-4 sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);

        const firstName = ((fd.get("firstName") as string) ?? "").trim();
        const lastName = ((fd.get("lastName") as string) ?? "").trim();
        const address = ((fd.get("address") as string) ?? "").trim();
        const country = ((fd.get("country") as string) ?? "").trim();
        const telegramId = ((fd.get("telegramId") as string) ?? "").trim();
        const whatsappLocal = ((fd.get("whatsappLocal") as string) ?? "").trim();
        const mobileLocal = ((fd.get("mobileLocal") as string) ?? "").trim();
        const whatsappFull = combineDialAndLocal(
          String(fd.get("whatsappDial") ?? DEFAULT_PHONE_DIAL),
          whatsappLocal,
        );
        const mobileNumber = combineDialAndLocal(
          String(fd.get("mobileDial") ?? DEFAULT_PHONE_DIAL),
          mobileLocal,
        );
        const nextErrors: Record<string, string> = {};
        if (!firstName) nextErrors.firstName = "First name is required";
        if (!lastName) nextErrors.lastName = "Last name is required";
        if (!address) nextErrors.address = "Address is required";
        if (!country) nextErrors.country = "Country is required";
        if (!digitsOnly(whatsappLocal))
          nextErrors.whatsappNumber = "Whatsapp number is required";
        if (!digitsOnly(mobileLocal))
          nextErrors.mobileNumber = "Mobile number is required";
        if (!telegramId) nextErrors.telegramId = "Telegram ID is required";
        if (!documentFile) nextErrors.document = "Document is required";
        if (!profileFile) nextErrors.profilePic = "Profile picture is required";
        if (!accepted) nextErrors.accepted = "Please accept Terms & Conditions";
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        async function upload(kind: string, file: File | null) {
          if (!file) return undefined;
          const up = new FormData();
          up.set("kind", kind);
          up.set("file", file);
          const res = await fetch("/api/uploads", { method: "POST", body: up });
          if (!res.ok) throw new Error("Upload failed");
          const data = (await res.json()) as { url: string };
          return data.url;
        }

        const documentUrl = await upload("document", documentFile);
        const profilePicUrl = await upload("profile", profileFile);

        await onContinue({
          firstName,
          lastName,
          address,
          country,
          whatsappNumber: whatsappFull,
          mobileNumber,
          telegramId,
          documentUrl,
          profilePicUrl,
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          name="firstName"
          label="First Name"
          placeholder="Enter First name"
          error={fieldErrors.firstName}
        />
        <Field
          name="lastName"
          label="Last Name"
          placeholder="Enter Last name"
          error={fieldErrors.lastName}
        />
        <Field
          name="address"
          label="Address"
          placeholder="Enter address"
          error={fieldErrors.address}
        />
        <SelectField
          name="country"
          label="Country"
          placeholder="Select your Country"
          error={fieldErrors.country}
        />
        <PhoneField
          dialName="whatsappDial"
          numberName="whatsappLocal"
          label="Whatsapp Number"
          error={fieldErrors.whatsappNumber}
        />
        <PhoneField
          dialName="mobileDial"
          numberName="mobileLocal"
          label="Mobile Number"
          error={fieldErrors.mobileNumber}
        />
        <Field
          name="telegramId"
          label="Telegram ID"
          placeholder="@telegramID"
          error={fieldErrors.telegramId}
        />
      </div>

      <UploadCard
        label="Upload Document"
        buttonLabel="Upload Document"
        onFileSelected={setDocumentFile}
        error={fieldErrors.document}
      />
      <UploadCard
        label="Upload Profile Pic"
        buttonLabel="Upload Document"
        onFileSelected={setProfileFile}
        error={fieldErrors.profilePic}
      />

      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-xs leading-relaxed text-zinc-500 sm:text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600/20"
        />
        <span>
          Tap to accept our{" "}
          <a href="#" className="text-emerald-700 hover:underline">
            Terms &amp; Conditions
          </a>{" "}
          and{" "}
          <a href="#" className="text-emerald-700 hover:underline">
            Privacy Policy
          </a>
        </span>
      </label>
      {fieldErrors.accepted ? (
        <p className="text-xs text-red-600">{fieldErrors.accepted}</p>
      ) : null}

      <button
        type="submit"
        disabled={!accepted || saving}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm active:scale-[0.99]"
      >
        {saving ? "Saving..." : "Save Details and Continue"}
      </button>
    </form>
  );
}

type TabKey = "bank" | "wallet";
type WalletKey =
  | "Nagad"
  | "bKash"
  | "Rocket"
  | "uPay"
  | "SureCash"
  | "Tap"
  | "iPay"
  | "Google Pay"
  | "CashBaba"
  | "OK Wallet";

type BankWalletPatch =
  | {
      bankDetails: {
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        holderName?: string;
        branchName?: string;
      };
    }
  | {
      walletDetails: {
        provider?: string;
        walletId?: string;
      };
    };

function BankWalletStep({
  saving,
  onContinue,
}: {
  saving: boolean;
  onContinue: (patch: BankWalletPatch) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<TabKey>("bank");
  const [wallet, setWallet] = useState<WalletKey | null>("Nagad");

  const walletIconSrc: Record<WalletKey, string> = {
    Nagad: "/images/wallet-icon/nagad.png",
    bKash: "/images/wallet-icon/bkash.png",
    Rocket: "/images/wallet-icon/rocket.png",
    uPay: "/images/wallet-icon/upay.png",
    SureCash: "/images/wallet-icon/surecash.png",
    Tap: "/images/wallet-icon/tap.png",
    iPay: "/images/wallet-icon/ipay.png",
    "Google Pay": "/images/wallet-icon/gpay.png",
    CashBaba: "/images/wallet-icon/cashbaba.png",
    "OK Wallet": "/images/wallet-icon/okwallet.png",
  };

  const walletOptions: readonly WalletKey[] = [
    "Nagad",
    "bKash",
    "Rocket",
    "uPay",
    "SureCash",
    "Tap",
    "iPay",
    "Google Pay",
    "CashBaba",
    "OK Wallet",
  ];

  return (
    <form
      className="space-y-5 p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        if (tab === "bank") {
          onContinue({
            bankDetails: {
              accountNumber: (fd.get("accountNumber") as string) || undefined,
              ifscCode: (fd.get("ifscCode") as string) || undefined,
              bankName: (fd.get("bankName") as string) || undefined,
              holderName: (fd.get("holderName") as string) || undefined,
              branchName: (fd.get("branchName") as string) || undefined,
            },
          });
        } else {
          onContinue({
            walletDetails: {
              provider: wallet ?? undefined,
              walletId: (fd.get("walletId") as string) || undefined,
            },
          });
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <TabButton active={tab === "bank"} onClick={() => setTab("bank")}>
          <span className="inline-flex items-center gap-2">
            <BankIcon className="h-4 w-4" />
            Bank
          </span>
        </TabButton>
        <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")}>
          <span className="inline-flex items-center gap-2">
            <WalletIcon className="h-4 w-4" />
            Wallet
          </span>
        </TabButton>
      </div>

      {tab === "bank" ? (
        <>
          <Field
            name="accountNumber"
            label="Bank Account Number"
            placeholder="xxxx - xxxx - xxxx - xxxx"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field name="ifscCode" label="IFSC Code" placeholder="ABCD0000E" />
            <Field name="bankName" label="Bank Name" placeholder="Enter Bank name" />
            <Field name="holderName" label="Bank Holder Name" placeholder="Enter Bank Holder Name" />
            <Field name="branchName" label="Bank Branch Name" placeholder="Enter Bank Branch Name" />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-600">
              Choose your Wallet
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {walletOptions.map((name) => (
                <WalletOption
                  key={name}
                  name={name}
                  iconSrc={walletIconSrc[name]}
                  selected={wallet === name}
                  onSelect={() => setWallet(name)}
                />
              ))}
            </div>
          </div>

          <Field
            name="walletId"
            label="Wallet Number / UPI"
            placeholder="Enter wallet id"
          />
        </>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm active:scale-[0.99]"
      >
        {saving ? "Saving..." : "Save Details and Continue"}
      </button>
    </form>
  );
}

type BrandRelationValues = {
  usernameInPlatform?: string;
  hadPreviousTransaction?: boolean;
  transactionId?: string;
};

function BrandRelationStep({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (values: BrandRelationValues) => void | Promise<void>;
}) {
  const [hadPreviousTransaction, setHadPreviousTransaction] = useState<
    "yes" | "no"
  >("yes");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-5 p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const usernameInPlatform = (
          (fd.get("usernameInPlatform") as string) ?? ""
        ).trim();
        const transactionId = ((fd.get("transactionId") as string) ?? "").trim();
        const next: Record<string, string> = {};
        if (!usernameInPlatform) {
          next.usernameInPlatform = "Username in platform is required";
        }
        if (!transactionId) {
          next.transactionId = "Transaction ID is required";
        }
        setFieldErrors(next);
        if (Object.keys(next).length > 0) return;

        onSubmit({
          usernameInPlatform,
          hadPreviousTransaction: hadPreviousTransaction === "yes",
          transactionId,
        });
      }}
    >
      <Field
        name="usernameInPlatform"
        label="Username in Platform"
        placeholder="Enter platform username"
        error={fieldErrors.usernameInPlatform}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-600">
          Have you made any previous transaction ?
        </p>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-zinc-600">
            <input
              type="radio"
              name="previousTransaction"
              checked={hadPreviousTransaction === "yes"}
              onChange={() => setHadPreviousTransaction("yes")}
              className="h-5 w-5 accent-emerald-600"
            />
            Yes
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-zinc-600">
            <input
              type="radio"
              name="previousTransaction"
              checked={hadPreviousTransaction === "no"}
              onChange={() => setHadPreviousTransaction("no")}
              className="h-5 w-5 accent-emerald-600"
            />
            No
          </label>
        </div>
      </div>

      <Field
        name="transactionId"
        label="Enter Transaction ID"
        placeholder="Enter transaction id"
        error={fieldErrors.transactionId}
      />

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm active:scale-[0.99]"
      >
        {saving ? "Saving..." : "Save Details and Continue"}
      </button>
    </form>
  );
}

type PlatformDetailsValues = {
  platformName?: string;
  platformLink?: string;
  usersRange?: string;
  turnoverRange?: string;
};

function PlatformDetailsStep({
  saving,
  onContinue,
}: {
  saving: boolean;
  onContinue: (values: PlatformDetailsValues) => void | Promise<void>;
}) {
  return (
    <form
      className="space-y-5 p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onContinue({
          platformName: (fd.get("platformName") as string) || undefined,
          platformLink: (fd.get("platformLink") as string) || undefined,
          usersRange: (fd.get("usersRange") as string) || undefined,
          turnoverRange: (fd.get("turnoverRange") as string) || undefined,
        });
      }}
    >
      <Field name="platformName" label="Platform Name" placeholder="Enter Platform name" />
      <Field
        name="platformLink"
        label="Platform link"
        placeholder="https://www.platformlink.com/"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectInput
          name="usersRange"
          label="Number of Users (approximate)"
          placeholder="Select a range"
          options={[
            "0 - 1k",
            "1k - 5k",
            "5k - 10k",
            "10k - 50k",
            "50k+",
          ]}
        />
        <SelectInput
          name="turnoverRange"
          label="Monthly Turnover (approximate)"
          placeholder="Select a range"
          options={["0 - 10k", "10k - 20k", "20k - 50k", "50k - 100k", "100k+"]}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm active:scale-[0.99]"
      >
        {saving ? "Saving..." : "Save Details and Continue"}
      </button>
    </form>
  );
}

function TabButton({
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
        "inline-flex min-h-12 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors sm:px-4",
        active
          ? "border-emerald-900 bg-emerald-950 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function WalletOption({
  name,
  iconSrc,
  selected,
  onSelect,
}: {
  name: string;
  iconSrc: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-md border bg-white px-2 text-[11px] font-medium leading-tight transition-colors sm:gap-2 sm:px-3 sm:text-xs",
        selected
          ? "border-emerald-600 ring-2 ring-emerald-600/15"
          : "border-zinc-200 hover:bg-zinc-50",
      ].join(" ")}
    >
      <img
        src={iconSrc}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5"
        aria-hidden="true"
      />
      <span className="truncate">{name}</span>
    </button>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 10h16" />
      <path d="M6 10v9" />
      <path d="M10 10v9" />
      <path d="M14 10v9" />
      <path d="M18 10v9" />
      <path d="M3 19h18" />
      <path d="M5 10l7-5 7 5" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
      <path d="M21 12v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2Z" />
      <path d="M16 12h5" />
    </svg>
  );
}

function Field({
  name,
  label,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className={[
          "min-h-12 w-full rounded-md bg-zinc-100/60 px-3 py-2.5 text-base text-zinc-900 outline-none ring-1 ring-inset focus:bg-white sm:text-sm",
          error
            ? "ring-red-300 focus:ring-red-500/30"
            : "ring-zinc-200 focus:ring-emerald-600/20",
        ].join(" ")}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  name,
  label,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div className="relative">
        <select
          name={name}
          className={[
            "min-h-12 w-full appearance-none rounded-md bg-zinc-100/60 px-3 py-2 pr-10 text-base text-zinc-500 outline-none ring-1 ring-inset focus:bg-white sm:text-sm",
            error
              ? "ring-red-300 focus:ring-red-500/30"
              : "ring-zinc-200 focus:ring-emerald-600/20",
          ].join(" ")}
        >
          <option value="">{placeholder}</option>
          <option value="BD">Bangladesh</option>
          <option value="IN">India</option>
          <option value="PK">Pakistan</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        >
          <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
        </svg>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectInput({
  name,
  label,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div className="relative">
        <select
          name={name}
          className="min-h-12 w-full appearance-none rounded-md bg-zinc-100/60 px-3 py-2 pr-10 text-base text-zinc-500 outline-none ring-1 ring-inset ring-zinc-200 focus:bg-white focus:ring-emerald-600/20 sm:text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        >
          <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
        </svg>
      </div>
    </div>
  );
}

function PhoneField({
  dialName,
  numberName,
  label,
  error,
}: {
  dialName: string;
  numberName: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div
        className={[
          "flex min-h-12 overflow-hidden rounded-md bg-zinc-100/60 ring-1 ring-inset focus-within:bg-white",
          error
            ? "ring-red-300 focus-within:ring-red-500/30"
            : "ring-zinc-200 focus-within:ring-emerald-600/20",
        ].join(" ")}
      >
        <div className="relative shrink-0 border-r border-zinc-200">
          <select
            name={dialName}
            defaultValue={DEFAULT_PHONE_DIAL}
            aria-label={`${label} country code`}
            className="min-h-12 min-w-[5.25rem] appearance-none bg-transparent py-2 pl-3 pr-7 text-base text-zinc-700 outline-none sm:text-sm"
          >
            {PHONE_DIAL_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          >
            <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
          </svg>
        </div>
        <input
          name={numberName}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="00000 - 00000"
          className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-sm"
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function UploadCard({
  label,
  buttonLabel,
  onFileSelected,
  error,
}: {
  label: string;
  buttonLabel: string;
  onFileSelected: (file: File | null) => void;
  error?: string;
}) {
  const [filename, setFilename] = useState<string | null>(null);
  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-600">{label}</p>
      <div
        className={[
          "rounded-lg border border-dashed bg-white px-4 py-8",
          error ? "border-red-300" : "border-zinc-200",
        ].join(" ")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0] ?? null;
          setFilename(f?.name ?? null);
          onFileSelected(f);
        }}
      >
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-600/10 text-emerald-700">
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
              <path d="M12 3v12" />
              <path d="m7 8 5-5 5 5" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            </svg>
          </div>
          <p className="text-xs text-zinc-400">Drag and drop Image here</p>
          <p className="text-xs text-zinc-300">or</p>
          <input
            id={inputId}
            type="file"
            className="sr-only"
            accept="image/*,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFilename(f?.name ?? null);
              onFileSelected(f);
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.99]"
          >
            {buttonLabel}
          </button>
          {filename ? (
            <p className="mt-2 text-[11px] text-zinc-500">{filename}</p>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

