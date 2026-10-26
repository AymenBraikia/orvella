import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { orders_collection } from "../db/collections";
import { build_quote, is_address_complete, normalise_currency, order_from_quote, type Quote } from "./checkout";
import { get_checkout_customer, guest_cart_id } from "./cart";
import { reserve_items } from "./inventory";
import { next_order_number } from "./order_number";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import type { Order, PaymentMethod } from "@/types/order";

export type PlaceError = "auth" | "empty" | "address" | "details" | "unavailable" | "method" | "payment";
export type Placed = { ok: true; order: Order; quote: Quote } | { ok: false; error: PlaceError; items?: string[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shared by every payment method: price the visitor's cart from the database, check the details,
 * reserve the pieces until `reserved_until` and store the order as "pending payment".
 * Works for signed-in customers and guests.
 */
export async function place_pending_order(payment_method: PaymentMethod, reserved_until: Date): Promise<Placed> {
    const customer = await get_checkout_customer();
    if (!customer) return { ok: false, error: "empty" };

    const quote = await build_quote(customer.cart, customer, normalise_currency((await cookies()).get("Currency")?.value));

    if (quote.unavailable.length) return { ok: false, error: "unavailable", items: quote.unavailable };
    if (!quote.lines.length) return { ok: false, error: "empty" };
    if (!EMAIL.test(customer.email) || !customer.firstName.trim() || !customer.lastName.trim()) return { ok: false, error: "details" };
    if (!is_address_complete(quote.address)) return { ok: false, error: "address" };

    const id = await next_order_number();
    const failed = await reserve_items(
        id,
        quote.lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        reserved_until,
    );
    if (failed.length) return { ok: false, error: "unavailable", items: quote.lines.filter((l) => failed.includes(l.slug)).map((l) => l.name) };

    const order: Order = {
        ...order_from_quote(id, quote, customer, payment_method, reserved_until, await getLocale()),
        phone: quote.address == "Local Pickup" ? customer.address.phone : (quote.address.phone ?? customer.address.phone),
        guest: customer.guest,
        cart_id: customer.cart_id,
        // Lets the buyer open their order page without an account (link on the thank-you page and in emails).
        access_token: randomBytes(24).toString("hex"),
    };
    await (await orders_collection()).insertOne({ ...order });

    return { ok: true, order, quote };
}

/** Can the current visitor act on (pay / cancel / view) this order? Account owner, or the guest's browser. */
export async function owns_order(order: Pick<Order, "email" | "cart_id" | "guest">): Promise<boolean> {
    const token = (await cookies()).get("accessToken")?.value;
    const payload = token ? verifyJwt(token) : null;
    if (payload?.email && payload.email === order.email && !order.guest) return true;

    const cart_id = await guest_cart_id();
    return Boolean(order.cart_id && cart_id && order.cart_id === cart_id);
}

/** Where the customer lands after placing an order (works for guests through the access token). */
export function thank_you_path(order: Pick<Order, "id" | "access_token">): string {
    return `/thank_you?order=${encodeURIComponent(order.id)}&token=${order.access_token}`;
}
