import { NextRequest, NextResponse } from "next/server";
import { release_expired_orders } from "@/app/server/orders";

/*
 * Returns lapsed reservations to stock and cancels the unpaid orders behind them.
 * Called by Vercel Cron (see vercel.json), which sends "Authorization: Bearer $CRON_SECRET".
 * The storefront already treats lapsed holds as available, and checkouts release them on the
 * spot, so this job only keeps the database and the order list tidy.
 */
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const cancelled = await release_expired_orders();
    return NextResponse.json({ cancelled });
}
