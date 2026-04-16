 "use client";

import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

        <main className="flex items-center justify-center px-6 py-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15">
                <Image
                  src="/images/frame.png"
                  alt=""
                  width={28}
                  height={28}
                />
              </div>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Login to your Account
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              access your tasks, messages and status anytime, anywhere and keep
              everything flowing in one place
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
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setStatus("loading");
                  setMessage(null);
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile, password }),
                  });
                  const data = (await res.json().catch(() => null)) as
                    | { id: string; mobile: string }
                    | { error: string }
                    | null;

                  if (!res.ok) {
                    setStatus("error");
                    setMessage((data as any)?.error ?? "Login failed");
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
                <div className="flex h-11 overflow-hidden rounded-md border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-emerald-600/20">
                  <div className="flex items-center gap-2 border-r border-zinc-200 px-3 text-sm text-zinc-600">
                    <span>+91</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="text-zinc-400"
                      aria-hidden="true"
                    >
                      <path d="M5.5 7.5l4.5 5 4.5-5H5.5z" />
                    </svg>
                  </div>
                  <input
                    id="mobile"
                    name="mobile"
                    inputMode="numeric"
                    placeholder="00000 - 00000"
                    className="w-full px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••"
                    className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-500 hover:bg-zinc-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600/20"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-800 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "loading" ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

