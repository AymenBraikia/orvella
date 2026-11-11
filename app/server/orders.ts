import "server-only";

import { orders_collection } from "../db/collections";
import { remove_from_cart } from "./cart";
import { mark_items_sold, release_expired_reservations, release_reservation } from "./inventory";
import type { Order, OrderStatus, StatusEvent } from "@/types/order";
import type { WithId } from "mongodb";
import { notify_order_cancelled } from "./email/notifications";

/*
 * Order state changes. Every change goes through here so stock, status and history stay in step.
 * Not a "use server" file: these must never be callable from the browser directly.
 */

function event(status: OrderStatus, note?: string, by?: string): StatusEvent {
    return { status, at: new Date(), ...(note ? { note } : {}), ...(by ? { by } : {}) };
}

function stock_lines(order: Pick<Order, "items">) {
    return order.items.map((i) => ({ slug: i.slug, quantity: i.quantity }));
}

/** Cancel an order that has not been paid yet and put its pieces back on sale. */
export async function cancel_order(id: string, note: string, by?: string): Promise<Order | null> {
    const orders = await orders_collection();

    const order = await orders.findOneAndUpdate(
        { id, status: "pending_payment" },
        { $set: { status: "cancelled", updated_at: new Date() }, $push: { status_history: event("cancelled", note, by) } },
        { returnDocument: "after", projection: { _id: 0 } },
    );
    if (!order) return null;

    await release_reservation(id, order.items.map((i) => i.slug));
    return order;
}

/**
 * Payment confirmed: pieces leave stock, the customer's cart is cleared. A cancelled order can
 * still be marked paid (money that arrives after a hold lapsed must not be lost); if its pieces
 * were sold meanwhile they are recorded in `stock_conflicts` for the dealer to resolve.
 */
export async function mark_order_paid(id: string, note: string, extra: Partial<Order> = {}, by?: string): Promise<Order | null> {
    const orders = await orders_collection();

    const order = await orders.findOneAndUpdate(
        { id, status: { $in: ["pending_payment", "cancelled"] } },
        { $set: { ...extra, status: "paid", updated_at: new Date() }, $unset: { reserved_until: "" }, $push: { status_history: event("paid", note, by) } },
        { returnDocument: "after", projection: { _id: 0 } },
    );
    if (!order) return null;

    const conflicts = await mark_items_sold(id, stock_lines(order));
    if (conflicts.length) {
        console.error(`Order ${id} was paid but these pieces were no longer in stock:`, conflicts);
        await orders.updateOne({ id }, { $set: { stock_conflicts: conflicts } });
    }

    // Bought pieces leave the cart that placed the order (account or guest cart).
    await remove_from_cart(order.guest && order.cart_id ? { guest: true, id: order.cart_id } : { guest: false, id: order.email }, order.items.map((i) => i.slug));

    return { ...order, ...(conflicts.length ? { stock_conflicts: conflicts } : {}) };
}

/** Return lapsed holds to stock and cancel the orders that were waiting on them. */
export async function release_expired_orders(): Promise<string[]> {
    const order_ids = await release_expired_reservations();
    const cancelled: string[] = [];

    for (const id of order_ids) {
        const order = await cancel_order(id, "Reservation expired before payment was received");
        if (!order) continue;
        cancelled.push(id);
        // Bank transfer customers hear that the hold ended; abandoned PayPal windows do not.
        await notify_order_cancelled(order, "expired");
    }

    return cancelled;
}

const LEGACY_STATUS: Record<string, OrderStatus> = { Pending: "pending_payment", Completed: "paid", Failed: "cancelled" };

type LegacyOrder = Partial<Order> & { total?: number; amount_to_pay?: number; discount_amount?: number; status?: string };

/** Orders written before the stock/totals rework have a different shape; present them in the current one. */
export function normalize_order(doc: WithId<Order> | Order | LegacyOrder): Order {
    const raw = { ...(doc as LegacyOrder) };
    delete (raw as { _id?: unknown })._id;

    const status = (LEGACY_STATUS[raw.status ?? ""] ?? raw.status ?? "pending_payment") as OrderStatus;

    const items = (raw.items ?? []).map((i) => {
        const legacy = i as unknown as Record<string, unknown>;
        if (typeof legacy.unit_price === "number") return i;

        const name = legacy.type == "watch" || legacy.type == "spare" ? `${legacy.brand ?? ""} ${legacy.model ?? ""}`.trim() : String(legacy.display_name ?? legacy.slug);
        const price = Number(legacy.price ?? 0);
        const quantity = Number(legacy.quantity ?? 1);

        return { slug: String(legacy.slug), type: legacy.type, name, image: (legacy.images as string[] | undefined)?.[0], quantity, unit_price_eur: price, unit_price: price, total: price * quantity } as Order["items"][number];
    });

    return {
        ...(raw as Order),
        status,
        items,
        exchange_rate: raw.exchange_rate ?? 1,
        status_history: raw.status_history ?? [{ status, at: raw.created_at ?? new Date(0) }],
        totals: raw.totals ?? {
            items: raw.total ?? 0,
            shipping: 0,
            tax: 0,
            tax_included: 0,
            discount: raw.discount_amount ?? 0,
            total: raw.amount_to_pay ?? raw.total ?? 0,
        },
        tax: raw.tax ?? { mode: "included", rate: 0 },
    };
}

export async function orders_for_email(email: string, include_guest_orders = false): Promise<Order[]> {
    // Guest orders stay out of account pages: emails are not verified, so an account with the same
    // address must not reveal them. Guests open their order through its access link instead.
    const docs = await (await orders_collection()).find(include_guest_orders ? { email } : { email, guest: { $ne: true } }, { projection: { _id: 0 }, sort: { created_at: -1 } }).toArray();
    return JSON.parse(JSON.stringify(docs.map(normalize_order)));
}

/** Add to the dealer's notes without overwriting what is already there. */
function joined_notes(order: Pick<Order, "admin_notes">, note: string): string {
    return order.admin_notes ? `${order.admin_notes}\n${note}` : note;
}

export async function add_admin_note(order: Pick<Order, "id" | "admin_notes">, note: string) {
    if (order.admin_notes?.includes(note)) return;
    await (await orders_collection()).updateOne({ id: order.id }, { $set: { admin_notes: joined_notes(order, note) } });
}

/**
 * Something happened to the payment that the dealer must see: a status-history entry and an admin
 * note. PayPal resends events, so each id counts once; returns false for a repeat.
 */
export async function record_payment_event(order: Order, event_id: string, note: string): Promise<boolean> {
    const result = await (await orders_collection()).updateOne(
        { id: order.id, paypal_events: { $ne: event_id } },
        { $set: { admin_notes: joined_notes(order, note), updated_at: new Date() }, $push: { status_history: event(order.status, note, "PayPal"), paypal_events: event_id } },
    );
    return result.modifiedCount === 1;
}

/** Status changes the dealer can make from the admin, and from which states. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending_payment: ["paid", "cancelled"],
    paid: ["shipped", "refunded"],
    shipped: ["delivered", "refunded"],
    delivered: ["refunded"],
    cancelled: ["paid"],
    refunded: [],
};

export type TransitionResult = { ok: true; order: Order } | { ok: false; error: string };

/**
 * Move an order to `next`. Payment and cancellation go through mark_order_paid / cancel_order so
 * stock follows; the rest only change status (refunds are made in PayPal / the bank, not here).
 */
export async function transition_order(id: string, next: OrderStatus, options: { by: string; note?: string; tracking?: { carrier: string; number: string } }): Promise<TransitionResult> {
    const orders = await orders_collection();
    const current = await orders.findOne({ id }, { projection: { _id: 0 } });
    if (!current) return { ok: false, error: "Order not found." };

    const normalized = normalize_order(current);
    const status = normalized.status;
    if (!ORDER_TRANSITIONS[status].includes(next)) return { ok: false, error: `An order that is "${status}" cannot become "${next}".` };

    // Orders from before the status rework ("Pending", "Completed"...) are upgraded in place first.
    if ((current.status as string) !== status || !current.status_history || !current.totals) {
        await orders.updateOne({ id, status: current.status }, { $set: { status, status_history: normalized.status_history, totals: normalized.totals, tax: normalized.tax, exchange_rate: normalized.exchange_rate, items: normalized.items } });
    }

    const note = options.note?.trim() || undefined;

    if (next == "paid") {
        const order = await mark_order_paid(id, note ?? (current.payment_method == "Bank Transfer" ? "Bank transfer received" : "Marked as paid"), {}, options.by);
        return order ? { ok: true, order } : { ok: false, error: "The order could not be marked as paid." };
    }

    if (next == "cancelled") {
        const order = await cancel_order(id, note ?? "Cancelled by the store", options.by);
        return order ? { ok: true, order } : { ok: false, error: "The order could not be cancelled." };
    }

    if (next == "shipped" && !(options.tracking?.carrier.trim() && options.tracking.number.trim())) return { ok: false, error: "Carrier and tracking number are required to mark an order as shipped." };

    const set: Partial<Order> = { status: next, updated_at: new Date() };
    if (next == "shipped" && options.tracking) set.tracking = { carrier: options.tracking.carrier.trim(), number: options.tracking.number.trim() };

    const history_note = next == "shipped" && set.tracking ? [note, `${set.tracking.carrier} ${set.tracking.number}`].filter(Boolean).join(" · ") : note;

    const order = await orders.findOneAndUpdate({ id, status }, { $set: set, $push: { status_history: event(next, history_note, options.by) } }, { returnDocument: "after", projection: { _id: 0 } });
    return order ? { ok: true, order } : { ok: false, error: "The order changed in the meantime — reload and try again." };
}

/** An order opened through its private access link (thank-you page, emails) — works without an account. */
export async function order_by_token(id: string, token: string): Promise<Order | null> {
    if (typeof id !== "string" || typeof token !== "string" || token.length < 32) return null;
    const doc = await (await orders_collection()).findOne({ id, access_token: token }, { projection: { _id: 0 } });
    return doc ? JSON.parse(JSON.stringify(normalize_order(doc))) : null;
}
