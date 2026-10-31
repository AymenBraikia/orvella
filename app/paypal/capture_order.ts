"use server";
import { orders_collection } from "../db/collections";
import { owns_order } from "../server/place_order";
import { capture_paypal_order, type CaptureResult } from "./capture";

export async function capture_order({ orderID }: { orderID: string }): Promise<CaptureResult> {
    const orders = await orders_collection();
    const order = typeof orderID == "string" ? await orders.findOne({ paypal_order_id: orderID }, { projection: { _id: 0 } }) : null;

    // The account that placed it, or the guest's browser (cart cookie).
    if (!order || !(await owns_order(order))) return { error: "not_found" };

    return capture_paypal_order(order);
}
