import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { minor_to_string } from "@/app/(site)/lib/order_totals";
import { absolute_url } from "@/app/(site)/lib/site_url";
import type { Quote } from "./checkout";
import type { Order } from "@/types/order";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

/*
 * Card payments through Stripe Checkout (Stripe's hosted payment page), via the REST API.
 *
 *   STRIPE_SECRET_KEY      sk_test_… / sk_live_…   (test or live is decided by the key)
 *   STRIPE_WEBHOOK_SECRET  whsec_… from the webhook endpoint pointing at /api/stripe/webhook
 *
 * An order is only marked paid from the signed webhook, never from the browser redirect.
 */

const API = "https://api.stripe.com/v1";

/** Stripe needs at least 30 minutes; the pieces are held a little longer than the session lives. */
export const STRIPE_SESSION_MINUTES = 30;

export function stripe_configured(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    // A demo never takes real card payments: only test keys are accepted there.
    return Boolean(key) && (!DEMO_MODE || key!.startsWith("sk_test_"));
}

/** Stripe's form encoding with nested keys: line_items[0][price_data][currency]=eur */
function form(data: Record<string, unknown>, prefix = "", out = new URLSearchParams()): URLSearchParams {
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) continue;
        const name = prefix ? `${prefix}[${key}]` : key;
        if (typeof value == "object") form(value as Record<string, unknown>, name, out);
        else out.append(name, String(value));
    }
    return out;
}

async function stripe<T>(path: string, body: Record<string, unknown>, idempotency_key?: string): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
            ...(idempotency_key ? { "Idempotency-Key": idempotency_key } : {}),
        },
        body: form(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Stripe ${path} failed (${res.status}): ${json?.error?.message ?? JSON.stringify(json)}`);
    return json as T;
}

/**
 * Hosted checkout for an order that is already reserved. The line items add up to exactly the
 * order total (items + shipping + VAT added on top), in the order currency's minor units.
 */
export async function create_checkout_session(order: Order, quote: Quote, locale: string): Promise<{ id: string; url: string }> {
    const currency = order.currency.toLowerCase();
    const { minor } = quote;

    const line_items: Record<string, unknown>[] = quote.lines.map((line, i) => ({
        quantity: line.quantity,
        price_data: { currency, unit_amount: minor.unit_minor[i], product_data: { name: line.name.slice(0, 250), ...(line.image?.startsWith("http") ? { images: { 0: line.image } } : {}) } },
    }));
    if (minor.shipping_minor > 0) line_items.push({ quantity: 1, price_data: { currency, unit_amount: minor.shipping_minor, product_data: { name: order.shipping ? `Shipping (${order.shipping.carrier})` : "Shipping" } } });
    if (minor.tax_minor > 0) line_items.push({ quantity: 1, price_data: { currency, unit_amount: minor.tax_minor, product_data: { name: `VAT ${order.tax.rate}%` } } });

    const thank_you = `/${locale}/thank_you?order=${encodeURIComponent(order.id)}&token=${order.access_token}`;

    const session = await stripe<{ id: string; url: string }>(
        "/checkout/sessions",
        {
            mode: "payment",
            line_items: Object.fromEntries(line_items.map((l, i) => [i, l])),
            customer_email: order.email,
            client_reference_id: order.id,
            metadata: { order_id: order.id },
            payment_intent_data: { metadata: { order_id: order.id }, description: `Order ${order.id}` },
            locale: ["en", "de", "es", "fr", "it", "tr"].includes(locale) ? locale : "auto",
            expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60,
            success_url: absolute_url(thank_you),
            cancel_url: absolute_url(`/${locale}/checkout?stripe_cancelled=${encodeURIComponent(order.id)}`),
        },
        `checkout-${order.id}`,
    );

    return { id: session.id, url: session.url };
}

/** Check the Stripe-Signature header (HMAC-SHA256 over "timestamp.body", 5 minute tolerance). */
export function verify_webhook(raw_body: string, header: string | null): boolean {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !header) return false;

    const parts = header.split(",").map((p) => p.split("=") as [string, string]);
    const timestamp = parts.find(([k]) => k == "t")?.[1];
    const signatures = parts.filter(([k]) => k == "v1").map(([, v]) => v);
    if (!timestamp || !signatures.length) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

    const expected = createHmac("sha256", secret).update(`${timestamp}.${raw_body}`).digest("hex");
    return signatures.some((sig) => sig.length == expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}

/** "1234.50" in the order currency, as Stripe reports it in minor units. */
export function stripe_amount(amount_minor: number, currency: string): string {
    return minor_to_string(amount_minor, currency.toUpperCase());
}
