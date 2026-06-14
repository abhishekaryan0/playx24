"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "play24x:auth:mobile";
const SALESMARTLY_SCRIPT_SRC =
  "https://plugin-code.salesmartly.com/js/project_640821_696078_1775544257.js";

export function SalesmartlyChat() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY)));
  }, []);

  if (!loggedIn) return null;

  return (
    <Script
      id="salesmartly-chat"
      src={SALESMARTLY_SCRIPT_SRC}
      strategy="afterInteractive"
    />
  );
}
