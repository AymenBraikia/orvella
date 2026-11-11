"use server";
import { items_collection } from "../db/collections";
import score_rewards from "@/app/(site)/lib/relevance_score";

const allowed_amounts = new Set(Object.values(score_rewards));

export default async function increase_relevance_score(slug: string, amount: number): Promise<boolean> {
    // Callable from the browser: only accept the known reward sizes.
    if (typeof slug !== "string" || !allowed_amounts.has(amount)) return false;

    try {
        const operation = await (await items_collection()).updateOne({ slug }, { $inc: { relevance_score: amount } });

        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while increasing relevance score: ");
        console.error(error);
        return false;
    }
}
