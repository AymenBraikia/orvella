"use server";

import { revalidatePath } from "next/cache";

import { appointments_collection, consignments_collection, orders_collection, sell_collection } from "@/app/db/collections";
import { Order } from "@/types/order";

import { get_admin_session } from "./session";
import type { ActionResult } from "./watch_actions";

export async function set_order_status(id: string, status: Order["status"]): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        await (await orders_collection()).updateOne({ id }, { $set: { status } });
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (err) {
        console.error("set_order_status failed:", err);
        return { success: false, error: "Could not update the order." };
    }
}

type EnquiryKind = "sell" | "consignment" | "appointment";

const collection_for = (kind: EnquiryKind) => (kind === "sell" ? sell_collection() : kind === "consignment" ? consignments_collection() : appointments_collection());

export async function set_enquiry_handled(kind: EnquiryKind, id: string, handled: boolean): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        (await collection_for(kind)).updateOne({ id }, { $set: { handled } });
        revalidatePath("/admin/enquiries");
        return { success: true };
    } catch (err) {
        console.error("set_enquiry_handled failed:", err);
        return { success: false, error: "Could not update the enquiry." };
    }
}

export async function delete_enquiry(kind: EnquiryKind, id: string): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        (await collection_for(kind)).deleteOne({ id });
        revalidatePath("/admin/enquiries");
        return { success: true };
    } catch (err) {
        console.error("delete_enquiry failed:", err);
        return { success: false, error: "Could not delete the enquiry." };
    }
}
