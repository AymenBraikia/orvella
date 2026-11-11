"use server";

import { revalidatePath } from "next/cache";
import { orders_collection } from "@/app/db/collections";
import { require_admin } from "@/app/server/admin_auth";
import { transition_order } from "@/app/server/orders";
import { after } from "next/server";
import { notify_order_cancelled, notify_order_paid, notify_order_shipped } from "@/app/server/email/notifications";
import type { OrderStatus } from "@/types/order";

const STATUSES: OrderStatus[] = ["pending_payment", "paid", "shipped", "delivered", "cancelled", "refunded"];

export async function change_order_status(id: string, next: OrderStatus, note?: string, tracking?: { carrier: string; number: string }): Promise<{ ok: boolean; error?: string }> {
    const admin = await require_admin();
    if (typeof id !== "string" || !STATUSES.includes(next)) return { ok: false, error: "Invalid request." };

    const result = await transition_order(id, next, {
        by: admin.email,
        note: typeof note == "string" ? note.slice(0, 500) : undefined,
        tracking: tracking ? { carrier: String(tracking.carrier ?? "").slice(0, 80), number: String(tracking.number ?? "").slice(0, 120) } : undefined,
    });

    revalidatePath("/", "layout");
    if (!result.ok) return { ok: false, error: result.error };

    const order = result.order;
    if (next == "paid") after(() => notify_order_paid(order, "admin"));
    if (next == "shipped") after(() => notify_order_shipped(order));
    if (next == "cancelled") after(() => notify_order_cancelled(order, "store"));

    return { ok: true };
}

export async function save_order_notes(id: string, notes: string): Promise<boolean> {
    await require_admin();
    if (typeof id !== "string" || typeof notes !== "string") return false;

    const result = await (await orders_collection()).updateOne({ id }, { $set: { admin_notes: notes.slice(0, 5000), updated_at: new Date() } });
    return result.matchedCount === 1;
}
