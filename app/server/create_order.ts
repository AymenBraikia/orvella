"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notify_order_placed } from "./email/notifications";
import { place_pending_order, thank_you_path, type PlaceError } from "./place_order";
import { remove_from_cart } from "./cart";
import { get_settings } from "./settings";

export type BankOrderResult = { redirect: string } | { error: PlaceError; items?: string[] };

/** Bank transfer: the order is placed now, the pieces are held until the dealer confirms the payment. */
export default async function create_order(): Promise<BankOrderResult> {
    const { reservation_days, payments } = await get_settings();
    if (!payments.bank_transfer) return { error: "method" };

    const placed = await place_pending_order("Bank Transfer", new Date(Date.now() + reservation_days * 24 * 60 * 60_000));
    if (!placed.ok) return { error: placed.error, items: placed.items };

    const { order } = placed;

    // The pieces now belong to this order; the cart starts fresh.
    await remove_from_cart(order.guest && order.cart_id ? { guest: true, id: order.cart_id } : { guest: false, id: order.email }, order.items.map((i) => i.slug));

    // Customer gets the bank details, the dealer a heads-up — after the response, never blocking it.
    after(() => notify_order_placed(order));

    revalidatePath("/", "layout");
    return { redirect: thank_you_path(order) };
}
