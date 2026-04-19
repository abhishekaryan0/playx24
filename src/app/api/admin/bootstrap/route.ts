import { NextResponse } from "next/server";
import { getAdminUsernameFromEnv } from "@/lib/admin-env";

export const runtime = "nodejs";

/**
 * Public bootstrap for the admin login form: username from env.
 * Password is never exposed — use ADMIN_PASSWORD on the server only (POST /api/admin/login).
 */
export async function GET() {
  return NextResponse.json({ username: getAdminUsernameFromEnv() });
}
