import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";

export { COOKIE_NAME };

export function signAdminSession(secret: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")))
      return false;
  } catch {
    return false;
  }
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    role?: string;
    exp?: number;
  };
  if (data.role !== "admin" || typeof data.exp !== "number") return false;
  if (data.exp < Date.now()) return false;
  return true;
}

/**
 * Secret used to sign admin session cookies. Set `NEXTAUTH_SECRET` in production.
 * Defaults to match common local setup so admin login works without env.
 */
export function getAdminSecret(): string {
  return process.env.NEXTAUTH_SECRET?.trim() || "playx24_secret";
}

/** Use Secure cookies only when the app is served over HTTPS (see NEXTAUTH_URL). */
export function sessionCookieSecure(): boolean {
  const url = process.env.NEXTAUTH_URL?.trim() ?? "";
  return url.startsWith("https://");
}
