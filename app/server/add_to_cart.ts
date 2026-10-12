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

        const newCart = user.cart.find((i) => i.slug == slug)
            ? {
                  $inc: {
                      "$.cart.quanitity": 1,
                  },
              }
            : { $push: { cart: { ...item, quantity: 1 } } };

        const operation = await (await users_collection()).updateOne({ email: user.email }, newCart);

        revalidatePath("/");
        return operation.acknowledged;
    } catch (error) {
        console.log("an error occured during adding item to cart: ");
        console.error(error);

        return false;
    }
}
