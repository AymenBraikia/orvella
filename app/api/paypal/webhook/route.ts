import { NextResponse } from "next/server";
import { handle_paypal_event, verify_paypal_webhook, type PayPalEvent } from "@/app/paypal/webhook";

/** PayPal retries anything that isn't a 2xx, so a failure here (say the database) is not lost. */
export async function POST(request: Request) {
    const body = await request.text();

    let event: PayPalEvent;
    try {
        event = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    if (!(await verify_paypal_webhook(body, request.headers))) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

    await handle_paypal_event(event);
    return NextResponse.json({ received: true });
}
