import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, getAdminSecret, verifyAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

export async function GET() {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !verifyAdminSession(token, secret)) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true });
}
