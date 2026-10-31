import "server-only";

import { setTimeout as sleep } from "node:timers/promises";
import { orders_collection } from "../db/collections";
import { getAccessToken, PAYPAL_API } from "./paypal";
import { amount_matches, capture_paypal_order, settle_paid_capture, type PayPalAmount } from "./capture";
import { record_payment_event, transition_order } from "../server/orders";
import { minor_to_string, to_minor } from "@/app/(site)/lib/order_totals";
import type { Order } from "@/types/order";

/*
 * PayPal → shop. The browser normally finishes a payment; this covers everything it can't: a closed
 * tab, a timeout after the capture, captures that settle days later, refunds made at PayPal.
 *
 *   PAYPAL_WEBHOOK_ID  id of the webhook pointing at /api/paypal/webhook, from the PayPal dashboard
 */

/** Lets the buyer's browser, which gets the same approval, capture first. */
const BROWSER_HEAD_START_MS = 5000;

export type PayPalResource = {
    id: string;
    status?: string;
    amount?: PayPalAmount;
    custom_id?: string;
    invoice_id?: string;
    links?: { rel: string; href: string }[];
    supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
};

export type PayPalEvent = { id: string; event_type: string; resource: PayPalResource };

/** Ask PayPal whether it really sent this. Anything we can't confirm counts as forged. */
export async function verify_paypal_webhook(raw_body: string, headers: Headers): Promise<boolean> {
    const webhook_id = process.env.PAYPAL_WEBHOOK_ID;
    const signed = {
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
    };
    if (!webhook_id || Object.values(signed).some((v) => !v)) return false;

    const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await getAccessToken()}`, "Content-Type": "application/json" },
        // The event goes in byte for byte: the signature covers the raw body, not a re-serialised copy.
        // The route has already checked it is valid JSON, so it cannot add fields of its own.
        body: `${JSON.stringify({ ...signed, webhook_id }).slice(0, -1)},"webhook_event":${raw_body}}`,
    });
    if (!res.ok) return false;

    return (await res.json()).verification_status == "SUCCESS";
}

/** Refund events carry the refund's own id, with the capture only in the "up" link. */
async function find_order(resource: PayPalResource): Promise<Order | null> {
    const up = resource.links?.find((l) => l.rel == "up")?.href.split("/").pop();
    const related = resource.supplementary_data?.related_ids;

    const order_ids = [resource.custom_id, resource.invoice_id].filter((id): id is string => Boolean(id));
    const paypal_ids = [related?.order_id, related?.capture_id, up, resource.id].filter((id): id is string => Boolean(id));

    return (await orders_collection()).findOne({ payment_method: "PayPal", $or: [{ id: { $in: order_ids } }, { paypal_order_id: { $in: paypal_ids } }, { paypal_capture_id: { $in: paypal_ids } }] }, { projection: { _id: 0 } });
}

function is_full_refund(order: Order, amount: PayPalAmount | undefined): boolean {
    return amount?.currency_code == order.currency && amount.value == minor_to_string(to_minor(order.totals.total, order.currency), order.currency);
}

export async function handle_paypal_event(event: PayPalEvent): Promise<void> {
    const { resource } = event;
    const order = await find_order(resource);
    if (!order) return;

    const amount = resource.amount ? `${resource.amount.value} ${resource.amount.currency_code}` : "unknown amount";

    switch (event.event_type) {
        case "CHECKOUT.ORDER.APPROVED": {
            await sleep(BROWSER_HEAD_START_MS);
            const current = await (await orders_collection()).findOne({ id: order.id }, { projection: { _id: 0 } });
            if (current) await capture_paypal_order(current);
            break;
        }
        case "PAYMENT.CAPTURE.COMPLETED":
            if (resource.amount && (await amount_matches(order, resource.amount))) await settle_paid_capture(order, resource.id);
            break;
        case "PAYMENT.CAPTURE.DENIED":
            await record_payment_event(order, event.id, `PayPal capture denied (${amount})`);
            break;
        case "PAYMENT.CAPTURE.REVERSED":
            await record_payment_event(order, event.id, `PayPal payment reversed (${amount})`);
            break;
        case "PAYMENT.CAPTURE.REFUNDED": {
            const full = is_full_refund(order, resource.amount);
            const first_time = await record_payment_event(order, event.id, `PayPal ${full ? "refund" : "partial refund"} (${amount})`);
            if (first_time && full) await transition_order(order.id, "refunded", { by: "PayPal" });
            break;
        }
    }
}
