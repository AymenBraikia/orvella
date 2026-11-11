"use server";

import { getAccessToken, PAYPAL_API } from "./paypal";
import { orders_collection } from "../db/collections";
import { ONLINE_RESERVATION_MINUTES } from "../server/checkout";
import { cancel_order } from "../server/orders";
import { owns_order, place_pending_order, type PlaceError } from "../server/place_order";
import { minor_to_string } from "@/app/(site)/lib/order_totals";
import { get_settings } from "../server/settings";
import { absolute_url } from "@/app/(site)/lib/site_url";

export type CreateOrderResult = { id: string } | { error: PlaceError; items?: string[] };

/** Signed-in customers and guests: reserve for 15 minutes, then open the PayPal order. */
export async function create_order(): Promise<CreateOrderResult> {
    const { payments, store_name } = await get_settings();
    if (!payments.paypal) return { error: "payment" };

    const placed = await place_pending_order("PayPal", new Date(Date.now() + ONLINE_RESERVATION_MINUTES * 60_000));
    if (!placed.ok) return { error: placed.error, items: placed.items };

    const { order, quote } = placed;
    const id = order.id;
    const { currency, minor } = quote;
    const money = (value: number) => ({ currency_code: currency, value: minor_to_string(value, currency) });

    try {
        const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${await getAccessToken()}`,
                "Content-Type": "application/json",
                "PayPal-Request-Id": id,
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: id,
                        invoice_id: id,
                        custom_id: id,
                        description: `Order ${id}`,
                        items: quote.lines.map((line, i) => ({
                            name: line.name.slice(0, 127),
                            sku: line.reference?.slice(0, 127),
                            quantity: String(line.quantity),
                            category: "PHYSICAL_GOODS",
                            unit_amount: money(minor.unit_minor[i]),
                        })),
                        amount: {
                            ...money(minor.total_minor),
                            breakdown: {
                                item_total: money(minor.items_minor),
                                tax_total: money(minor.tax_minor),
                                shipping: money(minor.shipping_minor),
                                discount: money(minor.discount_minor),
                            },
                        },
                    },
                ],
                application_context: {
                    brand_name: store_name.slice(0, 127),
                    landing_page: "LOGIN",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "PAY_NOW",

                    return_url: absolute_url("/thank_you/"),
                    cancel_url: absolute_url("/cart/"),
                },
            }),
        });

        const paypal_order = await res.json();
        if (!res.ok || !paypal_order.id) throw new Error(`PayPal order creation failed (${res.status}): ${JSON.stringify(paypal_order)}`);

        await (await orders_collection()).updateOne({ id }, { $set: { paypal_order_id: paypal_order.id } });

        return { id: paypal_order.id };
    } catch (error) {
        console.error(error);
        await cancel_order(id, "PayPal order could not be created");
        return { error: "payment" };
    }
}

/** The buyer closed the PayPal window or PayPal reported an error: free the pieces again. */
export async function cancel_paypal_order(paypal_order_id: string): Promise<void> {
    if (typeof paypal_order_id !== "string") return;

    const order = await (await orders_collection()).findOne({ paypal_order_id, status: "pending_payment" });
    if (order && (await owns_order(order))) await cancel_order(order.id, "PayPal payment cancelled by the customer");
}
