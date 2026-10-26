"use server";

import { revalidatePath } from "next/cache";
import { users_collection } from "../db/collections";
import getUser from "./get_user";
import { read_items_fresh } from "./inventory";
import { max_cart_quantity } from "@/app/(site)/lib/stock";

export default async function increase_cart(slug: string): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        const [item] = await read_items_fresh([slug]);
        if (!item || item.deleted) return false;

        const max = max_cart_quantity(item);

        const operation = await (await users_collection()).updateOne({ email: user.email, cart: { $elemMatch: { slug, quantity: { $lt: max } } } }, { $inc: { "cart.$.quantity": 1 } });

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while increasing cart quantity: ");
        console.error(error);
        return false;
    }
}
