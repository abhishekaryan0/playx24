"use client";

import Image from "next/image";
import Link from "next/link";

type AdminHeaderProps = {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  maxWidth?: "4xl" | "6xl";
  /** Extra row under title (e.g. application id) */
  meta?: React.ReactNode;
};

export function AdminHeader({
  title,
  description,
  back,
  actions,
  maxWidth = "6xl",
  meta,
}: AdminHeaderProps) {
  const mw = maxWidth === "4xl" ? "max-w-4xl" : "max-w-6xl";
  return (
    <header className="relative overflow-hidden border-b border-emerald-900/10 bg-white shadow-[0_4px_24px_rgba(27,67,50,0.07)]">
      <div className="h-1.5 bg-[#1b4332]" aria-hidden />
      <div className={`relative mx-auto ${mw} px-4 py-6 sm:px-6`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/layer.png"
          alt=""
          className="pointer-events-none absolute -right-8 top-2 h-44 w-auto max-w-[min(55%,20rem)] opacity-[0.14] sm:opacity-[0.22]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <Link
              href="/"
              className="shrink-0 self-start rounded-lg pt-0.5 ring-emerald-900/5 transition hover:ring-2"
            >
              <Image
                src="/images/play24x-logo.png"
                alt="Play24X"
                width={152}
                height={62}
                priority
                className="h-11 w-auto sm:h-12"
              />
            </Link>
            <div className="min-w-0 border-l border-emerald-200/90 pl-4 sm:pl-5">
              {back ? (
                <Link
                  href={back.href}
                  className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-900"
                >
                  <span className="text-base leading-none" aria-hidden>
                    ←
                  </span>
                  {back.label}
                </Link>
              ) : null}
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  {description}
                </p>
              ) : null}
              {meta ? <div className="mt-2">{meta}</div> : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end lg:pt-1">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
