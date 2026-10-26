"use server";

import { revalidatePath } from "next/cache";
import { read_items_fresh } from "./inventory";
import { max_cart_quantity } from "@/app/(site)/lib/stock";
import { cart_target } from "./cart";

export default async function increase_cart(slug: string): Promise<boolean> {
    try {
        const target = await cart_target();
        if (!target || typeof slug !== "string") return false;

        const [item] = await read_items_fresh([slug]);
        if (!item || item.deleted) return false;

        const max = max_cart_quantity(item);

        const operation = await target.collection.updateOne({ ...target.filter, cart: { $elemMatch: { slug, quantity: { $lt: max } } } }, { $inc: { "cart.$.quantity": 1 } });

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while increasing cart quantity: ");
        console.error(error);
        return false;
    }
}
