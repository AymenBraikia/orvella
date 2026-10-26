"use server";

import { revalidatePath } from "next/cache";
import { cart_target } from "./cart";

export default async function revmove_from_cart(slug: string): Promise<boolean> {
    try {
        const target = await cart_target();
        if (!target || typeof slug !== "string") return false;

        const operation = await target.collection.updateOne(target.filter, { $pull: { cart: { slug } } });

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occured during removing item from cart: ");
        console.error(error);

        return false;
    }
}
