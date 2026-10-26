"use server";

import { revalidatePath } from "next/cache";
import { users_collection } from "../db/collections";
import get_item from "./get_item";
import getUser from "./get_user";
import increase_relevance_score from "./increase_relevance_score";
import score_rewards from "@/app/(site)/lib/relevance_score";

export default async function addToCart(slug: string): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        const item = await get_item(slug);
        if (!item) return false;

        increase_relevance_score(slug, score_rewards.add_to_cart);

        const users = await users_collection();

        const operation = user.cart.find((i) => i.slug == slug)
            ? await users.updateOne({ email: user.email, "cart.slug": slug }, { $inc: { "cart.$.quantity": 1 } })
            : await users.updateOne({ email: user.email }, { $push: { cart: { ...item, quantity: 1 } } });

        revalidatePath("/");
        return operation.acknowledged;
    } catch (error) {
        console.log("an error occured during adding item to cart: ");
        console.error(error);

        return false;
    }
}
