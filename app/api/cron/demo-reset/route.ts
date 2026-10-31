import { NextRequest, NextResponse } from "next/server";
import { reset_demo } from "@/app/server/demo_reset";

/*
 * Nightly reset of the public demo. Called by Vercel Cron (see vercel.json), which sends
 * "Authorization: Bearer $CRON_SECRET". On a dealer's shop it does nothing.
 */
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const result = await reset_demo();
    return NextResponse.json(result ?? { skipped: true });
}
