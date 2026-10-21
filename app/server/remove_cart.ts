"use server";

import { revalidatePath } from "next/cache";
import { users_collection } from "../db/collections";
import get_item from "./get_item";
import getUser from "./get_user";

export default async function revmove_from_cart(slug: string): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        const item = await get_item(slug);
        if (!item) return false;

        const is_in_cart = user.cart.find((i) => i.slug == slug);

        if (!is_in_cart) return false;

        const operation = await (
            await users_collection()
        ).updateOne(
            { email: user.email },
            {
                $pull: {
                    cart: {
                        slug,
                    },
                },
            },
        );

        revalidatePath("/");
        return operation.acknowledged;
    } catch (error) {
        console.log("an error occured during adding item to cart: ");
        console.error(error);

        return false;
    }
}
