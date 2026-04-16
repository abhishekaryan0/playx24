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

      <div className="relative bg-[var(--app-surface)] px-10 py-8 overflow-hidden">
        <img
          className="absolute top-[-20%] right-0 w-[50%]"
          src="/images/layer.png"
          alt="Play24X"
          width={190}
          height={76}
        />

        {actions ? (
          <div className="absolute right-10 top-8 z-10 flex items-center gap-3">
            {actions}
          </div>
        ) : null}

        <div className="relative flex flex-col gap-3">
          <Link href="/" className="inline-flex w-fit">
            <Image
              src="/images/play24x-logo.png"
              alt="Play24X"
              width={190}
              height={76}
              priority
            />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Application for{" "}
            <span className="text-emerald-700">{highlightText}</span>{" "}
            {suffix ? suffix : null}
          </h1>
          <p className="max-w-xl text-sm text-zinc-500">
            One account to protect your device from unwanted, unlimited privacy
            everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}

