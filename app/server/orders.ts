import "server-only";

import { orders_collection, users_collection } from "../db/collections";
import { mark_items_sold, release_expired_reservations, release_reservation } from "./inventory";
import type { Order, OrderStatus, StatusEvent } from "@/types/order";
import type { WithId } from "mongodb";

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

    await (await users_collection()).updateOne({ email: order.email }, { $pull: { cart: { slug: { $in: order.items.map((i) => i.slug) } } } });

    return { ...order, ...(conflicts.length ? { stock_conflicts: conflicts } : {}) };
}

/** Return lapsed holds to stock and cancel the orders that were waiting on them. */
export async function release_expired_orders(): Promise<string[]> {
    const order_ids = await release_expired_reservations();
    const cancelled: string[] = [];

    for (const id of order_ids) {
        if (await cancel_order(id, "Reservation expired before payment was received")) cancelled.push(id);
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

export async function orders_for_email(email: string): Promise<Order[]> {
    const docs = await (await orders_collection()).find({ email }, { projection: { _id: 0 }, sort: { created_at: -1 } }).toArray();
    return JSON.parse(JSON.stringify(docs.map(normalize_order)));
}
