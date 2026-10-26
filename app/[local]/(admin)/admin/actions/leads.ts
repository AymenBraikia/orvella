"use server";

import { revalidatePath } from "next/cache";
import { consignments_collection, sell_collection } from "@/app/db/collections";
import { require_admin } from "@/app/server/admin_auth";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";

async function update_lead(id: string, set: Record<string, unknown>): Promise<boolean> {
    if (typeof id !== "string") return false;
    const update = { $set: { ...set, updated_at: new Date() } };

    const sell = await (await sell_collection()).updateOne({ id }, update);
    if (sell.matchedCount) return true;

    const consign = await (await consignments_collection()).updateOne({ id }, update);
    return consign.matchedCount > 0;
}

export async function set_lead_status(id: string, status: LeadStatus): Promise<boolean> {
    await require_admin();
    if (!LEAD_STATUSES.includes(status)) return false;

    const ok = await update_lead(id, { status, handled: status != "new" });
    revalidatePath("/admin", "layout");
    return ok;
}

export async function save_lead_notes(id: string, notes: string): Promise<boolean> {
    await require_admin();
    if (typeof notes !== "string") return false;
    return update_lead(id, { notes: notes.slice(0, 5000) });
}
