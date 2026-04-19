"use client";

import Image from "next/image";

export function AdminLoginShell({ children }: { children: React.ReactNode }) {
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/45 via-sky-200/25 to-fuchsia-300/30" />
          <div className="absolute left-10 top-10">
            <Image
              src="/images/play24x-logo.png"
              alt="Play24X"
              width={180}
              height={72}
              priority
            />
          </div>
          <div className="absolute bottom-8 left-10 right-10 max-w-xl text-xs leading-5 text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            Admin console — review agent applications, approve or reject
            submissions, and open full application details in one place.
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
