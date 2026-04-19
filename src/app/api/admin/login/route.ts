import { NextResponse } from "next/server";
import { getAdminPasswordFromEnv, getAdminUsernameFromEnv } from "@/lib/admin-env";
import {
  COOKIE_NAME,
  getAdminSecret,
  sessionCookieSecure,
  signAdminSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = getAdminSecret();

  const expectedUser = getAdminUsernameFromEnv();
  const expectedPass = getAdminPasswordFromEnv();

  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = signAdminSession(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
