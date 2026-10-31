import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { orders_collection } from "@/app/db/collections";
import { add_admin_note, cancel_order, mark_order_paid } from "@/app/server/orders";
import { notify_order_paid } from "@/app/server/email/notifications";
import { stripe_amount, verify_webhook } from "@/app/server/stripe";
import { minor_to_string, to_minor } from "@/app/(site)/lib/order_totals";

type Session = { id: string; payment_status: string; amount_total: number; currency: string; payment_intent?: string; metadata?: { order_id?: string } };

/**
 * Stripe → shop. The only place a card order becomes "paid". Configure in the Stripe dashboard:
 * endpoint https://<your-domain>/api/stripe/webhook with the checkout.session.* events below.
 */
export async function POST(request: Request) {
    const body = await request.text();
    if (!verify_webhook(body, request.headers.get("stripe-signature"))) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

    const event = JSON.parse(body) as { type: string; data: { object: Session } };
    const session = event.data.object;
    const order_id = session.metadata?.order_id;
    if (!order_id) return NextResponse.json({ received: true });

    const orders = await orders_collection();
    const order = await orders.findOne({ id: order_id }, { projection: { _id: 0 } });
    if (!order) return NextResponse.json({ received: true });

    switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            if (session.payment_status != "paid") break; // delayed methods finish with async_payment_succeeded

            const expected = minor_to_string(to_minor(order.totals.total, order.currency), order.currency);
            const received = stripe_amount(session.amount_total, session.currency);
            if (session.currency.toUpperCase() != order.currency || received != expected) {
                console.error(`Stripe paid ${received} ${session.currency} for ${order_id}, expected ${expected} ${order.currency}`);
                await add_admin_note(order, `Amount mismatch: Stripe paid ${received} ${session.currency.toUpperCase()}`);
                break;
            }

            const paid = await mark_order_paid(order_id, `Stripe payment ${session.payment_intent ?? session.id}`, { stripe_payment_intent: session.payment_intent });
            if (paid) after(() => notify_order_paid(paid, "online"));
            revalidatePath("/", "layout");
            break;
        }
        case "checkout.session.expired":
        case "checkout.session.async_payment_failed":
            await cancel_order(order_id, event.type == "checkout.session.expired" ? "Card payment not completed in time" : "Card payment failed");
            revalidatePath("/", "layout");
            break;
    }

    return NextResponse.json({ received: true });
}
