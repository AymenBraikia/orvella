"use server";

import { revalidatePath } from "next/cache";
import { users_collection } from "../db/collections";
import getUser from "./get_user";

export default async function decrease_cart(reference: string): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        const operation = await (
            await users_collection()
        ).updateOne(
            {
                email: user.email,
                cart: { $elemMatch: { reference, quantity: { $gt: 1 } } },
            },
            { $inc: { "cart.$.quantity": -1 } },
        );

        revalidatePath("/");
        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while decreasing cart quantity: ");
        console.error(error);
        return false;
    }
}
