"use server";

import { revalidatePath } from "next/cache";
import { enquiries_collection } from "@/app/db/collections";
import { require_admin } from "@/app/server/admin_auth";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";

export async function set_enquiry_status(id: string, status: LeadStatus): Promise<boolean> {
    await require_admin();
    if (typeof id !== "string" || !LEAD_STATUSES.includes(status)) return false;

    const result = await (await enquiries_collection()).updateOne({ id }, { $set: { status, handled: status != "new", updated_at: new Date() } });
    revalidatePath("/admin", "layout");
    return result.matchedCount === 1;
}

export async function save_enquiry_notes(id: string, notes: string): Promise<boolean> {
    await require_admin();
    if (typeof id !== "string" || typeof notes !== "string") return false;

    const result = await (await enquiries_collection()).updateOne({ id }, { $set: { notes: notes.slice(0, 5000), updated_at: new Date() } });
    return result.matchedCount === 1;
}
