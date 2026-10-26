"use server";

import { getLocale } from "next-intl/server";
import { orders_collection } from "../db/collections";
import { get_settings } from "./settings";
import { cancel_order } from "./orders";
import { owns_order, place_pending_order, type PlaceError } from "./place_order";
import { create_checkout_session, stripe_configured, STRIPE_SESSION_MINUTES } from "./stripe";

export type StripeStart = { url: string } | { error: PlaceError; items?: string[] };

/** Reserve the pieces, create the order and hand back Stripe's hosted payment page. */
export async function start_stripe_checkout(): Promise<StripeStart> {
    if (!(await get_settings()).payments.stripe || !stripe_configured()) return { error: "method" };

    // Held slightly longer than the Stripe session can live.
    const placed = await place_pending_order("Credit/Debit Card", new Date(Date.now() + (STRIPE_SESSION_MINUTES + 5) * 60_000));
    if (!placed.ok) return { error: placed.error, items: placed.items };

    const { order, quote } = placed;
    try {
        const session = await create_checkout_session(order, quote, await getLocale());
        await (await orders_collection()).updateOne({ id: order.id }, { $set: { stripe_session_id: session.id } });
        return { url: session.url };
    } catch (error) {
        console.error(error);
        await cancel_order(order.id, "Stripe checkout could not be started");
        return { error: "payment" };
    }
}

/** "Back" on Stripe's page: free the pieces right away instead of waiting for the session to expire. */
export async function cancel_stripe_order(order_id: string): Promise<void> {
    if (typeof order_id !== "string") return;
    const order = await (await orders_collection()).findOne({ id: order_id, payment_method: "Credit/Debit Card", status: "pending_payment" });
    if (order && (await owns_order(order))) await cancel_order(order.id, "Card payment cancelled by the customer");
}
