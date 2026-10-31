import "server-only";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getAccessToken, PAYPAL_API } from "./paypal";
import { orders_collection } from "../db/collections";
import score_rewards from "@/app/(site)/lib/relevance_score";
import increase_relevance_score from "../server/increase_relevance_score";
import { extend_reservation, holds_reservation, reserve_items } from "../server/inventory";
import { add_admin_note, cancel_order, mark_order_paid } from "../server/orders";
import { minor_to_string, to_minor } from "@/app/(site)/lib/order_totals";
import { ONLINE_RESERVATION_MINUTES } from "../server/checkout";
import { thank_you_path } from "../server/place_order";
import { notify_order_paid } from "../server/email/notifications";
import type { capture_result, Order } from "@/types/order";

export type CaptureResult = { redirect: string } | { error: "auth" | "not_found" | "unavailable" | "declined" | "pending" };

export type PayPalAmount = { currency_code: string; value: string };

/** Never mark an order paid for a different sum; the dealer gets a note instead. */
export async function amount_matches(order: Order, amount: PayPalAmount): Promise<boolean> {
    const expected = minor_to_string(to_minor(order.totals.total, order.currency), order.currency);
    if (amount.currency_code == order.currency && amount.value == expected) return true;

    console.error(`PayPal captured ${amount.value} ${amount.currency_code} for ${order.id}, expected ${expected} ${order.currency}`);
    await add_admin_note(order, `Amount mismatch: captured ${amount.value} ${amount.currency_code}`);
    return false;
}

/** The money is in: the order becomes paid. Safe to call twice, only the first call does anything. */
export async function settle_paid_capture(order: Order, capture_id: string) {
    const paid = await mark_order_paid(order.id, `PayPal capture ${capture_id}`, { paypal_capture_id: capture_id });
    if (!paid) return;

    after(() => notify_order_paid(paid, "online"));
    for (const { slug } of order.items) increase_relevance_score(slug, score_rewards.purchase);
    revalidatePath("/", "layout");
}

/** ORDER_ALREADY_CAPTURED is not a decline; a 422 with any other issue is PayPal's final no. */
function is_final_refusal(status: number, data: unknown): boolean {
    if (status != 422) return false;
    const details = (data as { details?: { issue?: string }[] }).details ?? [];
    return !details.some((d) => d.issue == "ORDER_ALREADY_CAPTURED");
}

/**
 * Take the money for an approved PayPal order. Called from the buyer's browser and from the webhook
 * when the browser never got that far; both send the same PayPal-Request-Id, so PayPal captures once.
 */
export async function capture_paypal_order(order: Order): Promise<CaptureResult> {
    if (order.status == "paid") return { redirect: thank_you_path(order) };
    if (order.status != "pending_payment" || !order.paypal_order_id) return { error: "not_found" };

    const lines = order.items.map((i) => ({ slug: i.slug, quantity: i.quantity }));
    const slugs = lines.map((l) => l.slug);

    // Never take the money for a piece that is no longer held for this order.
    if (!(await holds_reservation(order.id, lines))) {
        const failed = await reserve_items(order.id, lines, new Date(Date.now() + ONLINE_RESERVATION_MINUTES * 60_000));
        if (failed.length) {
            await cancel_order(order.id, "Pieces were no longer available when the payment was approved");
            return { error: "unavailable" };
        }
    }
    // Keep the hold while PayPal processes the capture.
    await extend_reservation(order.id, slugs, new Date(Date.now() + ONLINE_RESERVATION_MINUTES * 60_000));

    try {
        const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(order.paypal_order_id)}/capture`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${await getAccessToken()}`,
                "Content-Type": "application/json",
                "PayPal-Request-Id": `capture-${order.id}`,
            },
        });

        const data: capture_result = await res.json();
        const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

        if (!res.ok || !capture) {
            console.error(`PayPal capture for ${order.id} failed`, res.status, JSON.stringify(data));
            if (!is_final_refusal(res.status, data)) return { error: "pending" };

            await cancel_order(order.id, `PayPal capture failed (${data.status ?? res.status})`);
            return { error: "declined" };
        }

        // The order can be COMPLETED while the capture itself was refused.
        if (capture.status != "COMPLETED" && capture.status != "PENDING") {
            await cancel_order(order.id, `PayPal capture ${capture.status}`);
            return { error: "declined" };
        }

        const orders = await orders_collection();

        if (!(await amount_matches(order, capture.amount))) {
            await orders.updateOne({ id: order.id }, { $set: { paypal_capture_id: capture.id } });
            return { error: "pending" };
        }

        if (capture.status == "PENDING") {
            // e.g. eCheck or a review on PayPal's side. Keep the pieces held until it settles.
            await orders.updateOne({ id: order.id }, { $set: { paypal_capture_id: capture.id }, $push: { status_history: { status: "pending_payment", at: new Date(), note: "PayPal capture pending" } } });
            await extend_reservation(order.id, slugs, new Date(Date.now() + 3 * 24 * 60 * 60_000));
            return { error: "pending" };
        }

        await settle_paid_capture(order, capture.id);
        return { redirect: thank_you_path(order) };
    } catch (error) {
        // No clear answer, so the money may have been taken: keep the order, the webhook settles it.
        console.log("Caught an error: ", error);
        return { error: "pending" };
    }
}
