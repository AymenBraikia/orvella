"use server";

import { revalidatePath } from "next/cache";
import increase_relevance_score from "./increase_relevance_score";
import score_rewards from "@/app/(site)/lib/relevance_score";
import { read_items_fresh } from "./inventory";
import { max_cart_quantity } from "@/app/(site)/lib/stock";
import { cart_target } from "./cart";
import type { Cart_Line } from "@/types/user";

/** Works for signed-in customers and guests (guest carts are kept by a cart_id cookie). */
export default async function addToCart(slug: string): Promise<boolean> {
    try {
        if (typeof slug !== "string") return false;

        const [item] = await read_items_fresh([slug]);
        if (!item || item.deleted) return false;

        const target = await cart_target(true);
        if (!target) return false;

        const doc = await target.collection.findOne(target.filter, { projection: { cart: 1 } });
        const in_cart = ((doc?.cart ?? []) as Cart_Line[]).find((i) => i.slug == slug)?.quantity ?? 0;
        if (in_cart + 1 > max_cart_quantity(item)) return false;

        increase_relevance_score(slug, score_rewards.add_to_cart);

        const operation = in_cart
            ? await target.collection.updateOne({ ...target.filter, "cart.slug": slug }, { $inc: { "cart.$.quantity": 1 }, $set: { updated_at: new Date() } })
            : await target.collection.updateOne(target.filter, { $push: { cart: { slug, quantity: 1 } }, $set: { updated_at: new Date() } }, { upsert: target.guest });

        revalidatePath("/");
        return operation.modifiedCount + operation.upsertedCount > 0;
    } catch (error) {
        console.log("an error occured during adding item to cart: ");
        console.error(error);

        return false;
    }
}
