"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "play24x:auth:mobile";
const SALESMARTLY_SCRIPT_SRC =
  "https://plugin-code.salesmartly.com/js/project_640821_696078_1775544257.js";

declare global {
  interface Window {
    ssq?: { push: (command: string, ...args: unknown[]) => void };
    __ssc?: { setting?: { hideIcon?: boolean } };
  }
}

function MessageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function SalesmartlyChat() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const isLoggedIn = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
    if (isLoggedIn) {
      window.__ssc = window.__ssc ?? {};
      window.__ssc.setting = { hideIcon: true };
    }
    setLoggedIn(isLoggedIn);
  }, []);

  const openChat = useCallback(() => {
    const ssq = window.ssq;
    if (!ssq) return;
    ssq.push("onReady", () => {
      ssq.push("chatOpen");
    });
  }, []);

  if (!loggedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        aria-label="Open chat support"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_30px_rgba(5,150,105,0.45)] transition hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:cursor-wait disabled:opacity-70"
        style={{
          marginBottom: "env(safe-area-inset-bottom, 0px)",
          marginRight: "env(safe-area-inset-right, 0px)",
        }}
        disabled={!scriptReady}
      >
        <MessageIcon />
      </button>

      <Script
        id="salesmartly-chat"
        src={SALESMARTLY_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
    </>
  );
}
