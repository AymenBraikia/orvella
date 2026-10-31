import "server-only";

import { revalidateTag } from "next/cache";
import type { Document } from "mongodb";
import { items_collection } from "../db/collections";
import type { Item } from "@/types/item";

/*
 * Stock writes. Every update is a single-document pipeline update, so MongoDB applies the
 * condition and the change atomically: two checkouts racing for the last unit cannot both win.
 *
 * Invariant kept by every write here:
 *   status = quantity > 0 ? "available" : reservations.length ? "reserved" : "sold"
 *   inStock = quantity > 0
 *
 * Not a "use server" file on purpose: none of this may be callable from the browser.
 */

export type StockLine = { slug: string; quantity: number };

const STATUS_STAGE: Document = {
    $set: {
        status: {
            $cond: [{ $gt: ["$quantity", 0] }, "available", { $cond: [{ $gt: [{ $size: "$reservations" }, 0] }, "reserved", "sold"] }],
        },
        inStock: { $gt: ["$quantity", 0] },
        updated_at: "$$NOW",
    },
};

/** Gives legacy documents (only `inStock`) the stock fields, so the conditions below can rely on them. */
const NORMALISE_STAGE: Document = {
    $set: {
        quantity: { $ifNull: ["$quantity", { $cond: [{ $eq: ["$inStock", false] }, 0, 1] }] },
        reservations: { $ifNull: ["$reservations", []] },
    },
};

export function item_tags(slug: string): string[] {
    return ["watches", "items", `item:${slug}`, `watch:${slug}`];
}

/** Drop cached item data so stock changes show up on the next request. */
export function invalidate_items(slugs: string[]) {
    const tags = new Set(slugs.flatMap(item_tags));
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

async function normalise(slugs: string[]) {
    await (await items_collection()).updateMany({ slug: { $in: slugs }, $or: [{ quantity: { $exists: false } }, { reservations: { $exists: false } }] }, [NORMALISE_STAGE, STATUS_STAGE]);
}

/**
 * Return expired holds to stock. With `slugs` only those items are checked (used right before a
 * checkout); without, every item is (used by the cron job). Returns the ids of the orders whose
 * holds lapsed so the caller can cancel them.
 */
export async function release_expired_reservations(slugs?: string[]): Promise<string[]> {
    const items = await items_collection();
    const now = new Date();

    const filter: Document = { reservations: { $elemMatch: { until: { $lte: now } } } };
    if (slugs) filter.slug = { $in: slugs };

    const expired = await items.find(filter, { projection: { slug: 1, reservations: 1 } }).toArray();
    if (!expired.length) return [];

    await items.updateMany(filter, [
        { $set: { _expired: { $filter: { input: "$reservations", cond: { $lte: ["$$this.until", now] } } } } },
        {
            $set: {
                quantity: { $add: ["$quantity", { $sum: "$_expired.quantity" }] },
                reservations: { $filter: { input: "$reservations", cond: { $gt: ["$$this.until", now] } } },
            },
        },
        { $unset: "_expired" },
        STATUS_STAGE,
    ]);

    invalidate_items(expired.map((e) => e.slug));

    const order_ids = expired.flatMap((e) => (e.reservations ?? []).filter((r) => new Date(r.until) <= now).map((r) => r.order_id));
    return [...new Set(order_ids)];
}

/** Put back whatever `order_id` is holding. Safe to call more than once. */
export async function release_reservation(order_id: string, slugs: string[]) {
    const items = await items_collection();

    await items.updateMany({ slug: { $in: slugs }, "reservations.order_id": order_id }, [
        { $set: { _mine: { $filter: { input: "$reservations", cond: { $eq: ["$$this.order_id", order_id] } } } } },
        {
            $set: {
                quantity: { $add: ["$quantity", { $sum: "$_mine.quantity" }] },
                reservations: { $filter: { input: "$reservations", cond: { $ne: ["$$this.order_id", order_id] } } },
            },
        },
        { $unset: "_mine" },
        STATUS_STAGE,
    ]);

    invalidate_items(slugs);
}

async function reserve_line(order_id: string, line: StockLine, until: Date): Promise<boolean> {
    const items = await items_collection();

    const result = await items.updateOne({ slug: line.slug, deleted: { $ne: true }, quantity: { $gte: line.quantity }, "reservations.order_id": { $ne: order_id } }, [
        {
            $set: {
                quantity: { $subtract: ["$quantity", line.quantity] },
                reservations: { $concatArrays: ["$reservations", [{ order_id, quantity: line.quantity, until }]] },
            },
        },
        STATUS_STAGE,
    ]);

    return result.modifiedCount === 1;
}

/**
 * Hold every line for `order_id` until `until`, or nothing at all. Returns the slugs that could not
 * be reserved (empty on success).
 */
export async function reserve_items(order_id: string, lines: StockLine[], until: Date): Promise<string[]> {
    const slugs = lines.map((l) => l.slug);

    await normalise(slugs);
    await release_expired_reservations(slugs);

    const reserved: string[] = [];
    const failed: string[] = [];

    for (const line of lines) {
        if (await reserve_line(order_id, line, until)) reserved.push(line.slug);
        else failed.push(line.slug);
    }

    if (failed.length && reserved.length) await release_reservation(order_id, reserved);

    invalidate_items(slugs);
    return failed;
}

/** True when every line is still held for `order_id` and the hold has not lapsed. */
export async function holds_reservation(order_id: string, lines: StockLine[]): Promise<boolean> {
    const now = new Date();
    const count = await (
        await items_collection()
    ).countDocuments({
        slug: { $in: lines.map((l) => l.slug) },
        reservations: { $elemMatch: { order_id, until: { $gt: now } } },
    });

    return count === lines.length;
}

/** Push the expiry of an existing hold (e.g. right before capturing a payment). */
export async function extend_reservation(order_id: string, slugs: string[], until: Date) {
    await (await items_collection()).updateMany({ slug: { $in: slugs }, "reservations.order_id": order_id }, { $set: { "reservations.$[r].until": until } }, { arrayFilters: [{ "r.order_id": order_id }] });
}

/**
 * Payment received: the held units leave stock for good. If the hold already lapsed, the units are
 * taken from free stock instead. Returns slugs that could not be fulfilled (oversold).
 */
export async function mark_items_sold(order_id: string, lines: StockLine[]): Promise<string[]> {
    const items = await items_collection();
    const slugs = lines.map((l) => l.slug);
    await normalise(slugs);

    const conflicts: string[] = [];

    for (const line of lines) {
        const held = await items.updateOne({ slug: line.slug, "reservations.order_id": order_id }, [
            { $set: { reservations: { $filter: { input: "$reservations", cond: { $ne: ["$$this.order_id", order_id] } } }, sold_at: "$$NOW" } },
            STATUS_STAGE,
        ]);
        if (held.modifiedCount === 1) continue;

        const taken = await items.updateOne({ slug: line.slug, quantity: { $gte: line.quantity } }, [{ $set: { quantity: { $subtract: ["$quantity", line.quantity] }, sold_at: "$$NOW" } }, STATUS_STAGE]);
        if (taken.modifiedCount !== 1) conflicts.push(line.slug);
    }

    invalidate_items(slugs);
    return conflicts;
}

/** Demo reset: every piece back on sale and every hold gone. Unique pieces go back to exactly one. */
export async function restock_everything() {
    const items = await items_collection();
    const live = { deleted: { $ne: true } };
    const slugs = (await items.find(live, { projection: { _id: 0, slug: 1 } }).toArray()).map((i) => i.slug);

    await items.updateMany(live, [
        NORMALISE_STAGE,
        { $set: { quantity: { $cond: [{ $eq: ["$type", "spare"] }, { $max: [1, { $add: ["$quantity", { $sum: "$reservations.quantity" }] }] }, 1] }, reservations: [] } },
        { $unset: "sold_at" },
        STATUS_STAGE,
    ]);

    invalidate_items(slugs);
}

/** Fresh, uncached item documents for money and stock decisions. */
export async function read_items_fresh(slugs: string[]): Promise<Item[]> {
    return (await items_collection()).find({ slug: { $in: slugs } }, { projection: { _id: 0 } }).toArray();
}

/** Far-future expiry for holds the dealer places by hand ("reserved for a customer"). */
const MANUAL_HOLD_UNTIL = new Date("2100-01-01T00:00:00.000Z");
export const MANUAL_HOLD_ID = "manual";

/** Wrap plain values so a pipeline $set never reads strings like "$500" as field paths. */
function literal_set(fields: Record<string, unknown>): Document {
    return { $set: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { $literal: v }])) };
}

/** Write product fields and keep status/inStock consistent with the (possibly changed) quantity. */
export async function write_item_fields(slug: string, fields: Record<string, unknown>): Promise<boolean> {
    const result = await (await items_collection()).updateOne({ slug }, [NORMALISE_STAGE, literal_set(fields), STATUS_STAGE]);
    return result.matchedCount === 1;
}

/**
 * The dealer sets the stock state by hand (sold in the boutique, back on sale, held for a client).
 * Existing holds are dropped; pending orders for this piece will then fail their stock check.
 */
export async function admin_set_status(slug: string, status: "available" | "reserved" | "sold", unique: boolean): Promise<boolean> {
    const items = await items_collection();
    await normalise([slug]);

    const stages: Record<typeof status, Document[]> = {
        sold: [{ $set: { quantity: 0, reservations: [], sold_at: "$$NOW" } }],
        available: [{ $set: { quantity: unique ? 1 : { $max: [1, "$quantity"] }, reservations: [] } }, { $unset: "sold_at" }],
        reserved: [
            {
                $set: {
                    quantity: unique ? 0 : { $max: [0, { $subtract: ["$quantity", 1] }] },
                    reservations: [{ order_id: MANUAL_HOLD_ID, quantity: 1, until: MANUAL_HOLD_UNTIL }],
                },
            },
        ],
    };

    const result = await items.updateOne({ slug }, [...stages[status], STATUS_STAGE]);
    invalidate_items([slug]);
    return result.matchedCount === 1;
}
