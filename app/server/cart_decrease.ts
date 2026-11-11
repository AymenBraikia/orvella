"use server";

import { revalidatePath } from "next/cache";
import { cart_target } from "./cart";

export default async function decrease_cart(slug: string): Promise<boolean> {
    try {
        const target = await cart_target();
        if (!target || typeof slug !== "string") return false;

        const operation = await target.collection.updateOne({ ...target.filter, cart: { $elemMatch: { slug, quantity: { $gt: 1 } } } }, { $inc: { "cart.$.quantity": -1 } });

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while decreasing cart quantity: ");
        console.error(error);
        return false;
    }
}
