"use client";

import Image from "next/image";
import Link from "next/link";

export function ApplicationHeader({
  highlightText = "Wallet-Bank",
  suffixText = "Agent",
  actions,
}: {
  highlightText?: string;
  suffixText?: string;
  actions?: React.ReactNode;
}) {
  const suffix = suffixText?.trim();
  return (
    <div className="relative overflow-hidden">
      <div className="h-10 bg-[#1b4332]" />

      <div className="relative overflow-hidden bg-[var(--app-surface)] px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-10">
        <img
          className="pointer-events-none absolute right-0 top-[-20%] hidden w-[50%] max-w-[190px] sm:block"
          src="/images/layer.png"
          alt=""
          width={190}
          height={76}
        />

        <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3 lg:pr-4">
            <Link href="/" className="inline-flex w-fit max-w-full">
              <Image
                src="/images/play24x-logo.png"
                alt="Play24X"
                width={190}
                height={76}
                priority
                className="h-auto w-[min(100%,160px)] sm:w-[min(100%,190px)]"
              />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Application for{" "}
              <span className="text-emerald-700">{highlightText}</span>{" "}
              {suffix ? suffix : null}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-500">
              One account to protect your device from unwanted, unlimited privacy
              everywhere.
            </p>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 lg:pt-1">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
