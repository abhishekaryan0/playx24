import { NextResponse } from "next/server";
import { getWebPushConfig } from "@/lib/web-push";

export const runtime = "nodejs";

export async function GET() {
  const cfg = getWebPushConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Web push not configured" },
      { status: 501 },
    );
  }
  return NextResponse.json({ publicKey: cfg.publicKey });
}

