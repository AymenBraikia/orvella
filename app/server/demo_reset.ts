import "server-only";

import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { appointments_collection, consignments_collection, enquiries_collection, orders_collection, sell_collection } from "../db/collections";
import { restock_everything } from "./inventory";
import { cancel_order } from "./orders";
import { get_settings } from "./settings";

const KEEP_MS = 24 * 60 * 60_000;

/** Both must say yes: this deletes orders and customer requests, so it can never run on a dealer's shop. */
export async function demo_reset_enabled(): Promise<boolean> {
    return DEMO_MODE && (await get_settings()).demo_reset === true;
}

/**
 * Prospects try checkout on the public demo and would sell it out within days. Every night each
 * piece goes back on sale and anything older than a day disappears. Returns null when not enabled.
 */
export async function reset_demo(): Promise<{ cancelled: number; deleted: number } | null> {
    if (!(await demo_reset_enabled())) return null;

    const orders = await orders_collection();

    // Open orders would otherwise wait for a payment for pieces that are on sale again.
    const open = await orders.find({ status: "pending_payment" }, { projection: { _id: 0, id: 1 } }).toArray();
    for (const { id } of open) await cancel_order(id, "Nightly demo reset");

    await restock_everything();

    const old = { created_at: { $lt: new Date(Date.now() - KEEP_MS) } };
    const deleted = await Promise.all([orders.deleteMany(old), (await enquiries_collection()).deleteMany(old), (await sell_collection()).deleteMany(old), (await consignments_collection()).deleteMany(old), (await appointments_collection()).deleteMany(old)]);

    revalidatePath("/", "layout");
    return { cancelled: open.length, deleted: deleted.reduce((sum, r) => sum + r.deletedCount, 0) };
}
