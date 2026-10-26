"use server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { getAccessToken, PAYPAL_API } from "./paypal";
import { orders_collection } from "../db/collections";
import { capture_result } from "@/types/order";
import { revalidatePath } from "next/cache";
import score_rewards from "@/app/(site)/lib/relevance_score";
import increase_relevance_score from "../server/increase_relevance_score";
import { extend_reservation, holds_reservation, reserve_items } from "../server/inventory";
import { cancel_order, mark_order_paid } from "../server/orders";
import { minor_to_string, to_minor } from "@/app/(site)/lib/order_totals";
import { ONLINE_RESERVATION_MINUTES } from "../server/checkout";

export type CaptureResult = { redirect: string } | { error: "auth" | "not_found" | "unavailable" | "declined" | "pending" };

export async function capture_order({ orderID }: { orderID: string }): Promise<CaptureResult> {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const payload = token ? verifyJwt(token) : null;
    if (!payload) return { error: "auth" };

    const orders = await orders_collection();
    const order = await orders.findOne({ paypal_order_id: orderID }, { projection: { _id: 0 } });

    if (!order || order.email != payload.email) return { error: "not_found" };
    if (order.status == "paid") return { redirect: "/thank_you/" };
    if (order.status != "pending_payment") return { error: "not_found" };

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

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `capture-${order.id}`,
        },
    });

    const data: capture_result = await res.json();
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

    try {
        if (!res.ok || data.status != "COMPLETED" || !capture) {
            console.error(`PayPal capture for ${order.id} failed`, res.status, JSON.stringify(data));
            await cancel_order(order.id, `PayPal capture failed (${data.status ?? res.status})`);
            return { error: "declined" };
        }

        const expected = minor_to_string(to_minor(order.totals.total, order.currency), order.currency);
        if (capture.amount.currency_code != order.currency || capture.amount.value != expected) {
            // Should be impossible (we sent the amount), but never mark an order paid for a different sum.
            console.error(`PayPal captured ${capture.amount.value} ${capture.amount.currency_code} for ${order.id}, expected ${expected} ${order.currency}`);
            await orders.updateOne({ id: order.id }, { $set: { paypal_capture_id: capture.id, admin_notes: `Amount mismatch: captured ${capture.amount.value} ${capture.amount.currency_code}` } });
            return { error: "pending" };
        }

        if (capture.status == "PENDING") {
            // e.g. eCheck or a review on PayPal's side. Keep the pieces held until it settles.
            await orders.updateOne({ id: order.id }, { $set: { paypal_capture_id: capture.id }, $push: { status_history: { status: "pending_payment", at: new Date(), note: "PayPal capture pending" } } });
            await extend_reservation(order.id, slugs, new Date(Date.now() + 3 * 24 * 60 * 60_000));
            return { error: "pending" };
        }

        await mark_order_paid(order.id, `PayPal capture ${capture.id}`, { paypal_capture_id: capture.id });

        for (const slug of slugs) increase_relevance_score(slug, score_rewards.purchase);

        revalidatePath("/", "layout");

        return { redirect: "/thank_you/" };
    } catch (error) {
        console.log("Caught an error: ", error);
        return { error: "pending" };
    }
}
