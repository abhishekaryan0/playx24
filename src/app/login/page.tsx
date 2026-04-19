"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  combineDialAndLocal,
  DEFAULT_PHONE_DIAL,
  PHONE_DIAL_CODES,
} from "@/lib/phone";

export default function LoginPage() {
  const [dialCode, setDialCode] = useState(DEFAULT_PHONE_DIAL);
  const [mobile, setMobile] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] bg-[var(--app-bg)]">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden lg:block">
          <Image
            src="/images/login-left-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/40 via-sky-200/25 to-fuchsia-300/30" />

          <div className="absolute left-10 top-10 flex items-center gap-3">
            <Image
              src="/images/play24x-logo.png"
              alt="Play24X"
              width={180}
              height={72}
              priority
            />
          </div>

          <div className="absolute bottom-8 left-10 right-10 max-w-xl text-xs leading-5 text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
            Play24x (play24x.com) is an online gaming and sports betting
            platform. It includes a variety of digital gambling experiences,
            including a sportsbook for betting on events like the ICC Men&apos;s
            T20 World Cup, and various slot games and live casino options.
          </div>
        </aside>

        <main className="app-shell-pad flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between gap-3 lg:mb-8 lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15">
                  <Image
                    src="/images/frame.png"
                    alt=""
                    width={28}
                    height={28}
                  />
                </div>
                <Image
                  src="/images/play24x-logo.png"
                  alt="Play24X"
                  width={140}
                  height={56}
                  className="h-9 w-auto lg:hidden"
                />
              </div>
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Login to your Account
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:leading-6">
              Sign in with your registered mobile number.
            </p>

            {message ? (
              <div
                className={[
                  "mt-6 rounded-md border px-4 py-3 text-sm",
                  status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
              >
                {message}
              </div>
            ) : null}

            <form
              className="mt-6 space-y-5 sm:mt-8"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setStatus("loading");
                  setMessage(null);
                  const mobileFull = combineDialAndLocal(dialCode, mobile);
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile: mobileFull }),
                  });
                  const data = (await res.json().catch(() => null)) as
                    | { id: string; mobile: string }
                    | { error: string }
                    | null;

                  if (!res.ok) {
                    setStatus("error");
                    setMessage((data as { error?: string })?.error ?? "Login failed");
                    return;
                  }

                  setStatus("success");
                  setMessage("Login successful");
                } catch {
                  setStatus("error");
                  setMessage("Login failed");
                } finally {
                  if (status !== "success") setStatus("idle");
                }
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="mobile"
                  className="text-sm font-medium text-zinc-700"
                >
                  Mobile Number
                </label>
                <div className="flex min-h-12 overflow-hidden rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-emerald-600/20">
                  <div className="relative shrink-0 border-r border-zinc-200">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      aria-label="Mobile country code"
                      className="min-h-12 min-w-[5.25rem] appearance-none bg-transparent py-2 pl-3 pr-7 text-base text-zinc-700 outline-none"
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
                    id="mobile"
                    name="mobile"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="00000 - 00000"
                    className="min-h-12 min-w-0 flex-1 px-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600/20"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-800 text-base font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm active:scale-[0.99]"
              >
                {status === "loading" ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/apply/wallet"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-center text-sm font-semibold leading-snug text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25 active:scale-[0.99]"
              >
                Apply for Wallet agent
              </Link>
              <Link
                href="/apply/referral"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-center text-sm font-semibold leading-snug text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25 active:scale-[0.99]"
              >
                Apply for Referral agent
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
