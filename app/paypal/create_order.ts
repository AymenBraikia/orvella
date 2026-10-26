"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { getAccessToken, PAYPAL_API } from "./paypal";
import { orders_collection, users_collection } from "../db/collections";
import { build_quote, is_address_complete, normalise_currency, ONLINE_RESERVATION_MINUTES, order_from_quote } from "../server/checkout";
import { reserve_items } from "../server/inventory";
import { cancel_order } from "../server/orders";
import { next_order_number } from "../server/order_number";
import { minor_to_string } from "@/app/(site)/lib/order_totals";
import { get_settings } from "../server/settings";
import { absolute_url } from "@/app/(site)/lib/site_url";

export type CreateOrderResult = { id: string } | { error: "auth" | "empty" | "address" | "unavailable" | "payment"; items?: string[] };

export async function create_order(): Promise<CreateOrderResult> {
    const cookieStore = await cookies();
    const jwt_token = cookieStore.get("accessToken")?.value;

    const payload = jwt_token ? verifyJwt(jwt_token) : null;
    if (!payload) return { error: "auth" };

    const user = await (await users_collection()).findOne({ email: payload.email });
    if (!user) return { error: "auth" };

    if (!(await get_settings()).payments.paypal) return { error: "payment" };

    const quote = await build_quote(user.cart ?? [], user, normalise_currency(cookieStore.get("Currency")?.value));

    if (quote.unavailable.length) return { error: "unavailable", items: quote.unavailable };
    if (!quote.lines.length) return { error: "empty" };
    if (!is_address_complete(quote.address)) return { error: "address" };

    const id = await next_order_number();
    const reserved_until = new Date(Date.now() + ONLINE_RESERVATION_MINUTES * 60_000);

    const failed = await reserve_items(
        id,
        quote.lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        reserved_until,
    );
    if (failed.length) return { error: "unavailable", items: quote.lines.filter((l) => failed.includes(l.slug)).map((l) => l.name) };

    await (await orders_collection()).insertOne(order_from_quote(id, quote, user, "PayPal", reserved_until, await getLocale()));

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
                    brand_name: "orvella",
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
    const cookieStore = await cookies();
    const jwt_token = cookieStore.get("accessToken")?.value;

    const payload = jwt_token ? verifyJwt(jwt_token) : null;
    if (!payload || typeof paypal_order_id !== "string") return;

    const order = await (await orders_collection()).findOne({ paypal_order_id, email: payload.email, status: "pending_payment" });
    if (order) await cancel_order(order.id, "PayPal payment cancelled by the customer");
}
