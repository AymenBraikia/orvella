import "server-only";

import { counters_collection } from "../db/collections";
import { get_settings } from "./settings";

/**
 * Next human-friendly order number, e.g. ORV-2026-000123. The counter is one document per year,
 * incremented atomically, so concurrent checkouts can never get the same number.
 */
export async function next_order_number(now = new Date()): Promise<string> {
    const year = now.getUTCFullYear();
    const { order_prefix } = await get_settings();

    const counter = await (await counters_collection()).findOneAndUpdate({ _id: `order:${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });

    return format_order_number(order_prefix, year, counter!.seq);
}

export function format_order_number(prefix: string, year: number, seq: number): string {
    return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}
