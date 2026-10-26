"use server";

import { revalidatePath } from "next/cache";
import { users_collection } from "../db/collections";
import getUser from "./get_user";
import increase_relevance_score from "./increase_relevance_score";
import score_rewards from "@/app/(site)/lib/relevance_score";
import { read_items_fresh } from "./inventory";
import { max_cart_quantity } from "@/app/(site)/lib/stock";

export default async function addToCart(slug: string): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        const [item] = await read_items_fresh([slug]);
        if (!item || item.deleted) return false;

        const in_cart = user.cart.find((i) => i.slug == slug)?.quantity ?? 0;
        if (in_cart + 1 > max_cart_quantity(item)) return false;

        increase_relevance_score(slug, score_rewards.add_to_cart);

        const users = await users_collection();

        const operation = in_cart
            ? await users.updateOne({ email: user.email, "cart.slug": slug }, { $inc: { "cart.$.quantity": 1 } })
            : await users.updateOne({ email: user.email }, { $push: { cart: { slug, quantity: 1 } } });

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occured during adding item to cart: ");
        console.error(error);

        return false;
    }
}
