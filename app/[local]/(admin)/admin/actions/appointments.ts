"use server";

import { revalidatePath } from "next/cache";
import { appointments_collection } from "@/app/db/collections";
import { require_admin } from "@/app/server/admin_auth";
import type { AppointmentStatus } from "@/types/appointment";
import { after } from "next/server";
import { notify_appointment_confirmed } from "@/app/server/email/notifications";

const STATUSES: AppointmentStatus[] = ["requested", "confirmed", "cancelled", "done"];

export async function set_appointment_status(id: string, status: AppointmentStatus): Promise<boolean> {
    await require_admin();
    if (typeof id !== "string" || !STATUSES.includes(status)) return false;

    const before = await (await appointments_collection()).findOneAndUpdate({ id }, { $set: { status, handled: status != "requested", updated_at: new Date() } }, { projection: { _id: 0 } });
    revalidatePath("/admin", "layout");
    if (!before) return false;

    // Tell the customer once, when the appointment becomes confirmed.
    if (status == "confirmed" && before.status != "confirmed") after(() => notify_appointment_confirmed({ ...before, status }));
    return true;
}

export async function save_appointment_notes(id: string, notes: string): Promise<boolean> {
    await require_admin();
    if (typeof id !== "string" || typeof notes !== "string") return false;

    const result = await (await appointments_collection()).updateOne({ id }, { $set: { notes: notes.slice(0, 5000), updated_at: new Date() } });
    return result.matchedCount === 1;
}
