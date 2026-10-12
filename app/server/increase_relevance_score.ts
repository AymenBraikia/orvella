"use server";
import { watches_collection } from "../db/collections";

export default async function increase_relevance_score(slug: string, amount: number): Promise<boolean> {
    try {
        const operation = await (await watches_collection()).updateOne({ slug }, { $inc: { relevance_score: amount } });

        return operation.modifiedCount > 0;
    } catch (error) {
        console.log("an error occurred while increasing cart quantity: ");
        console.error(error);
        return false;
    }
}
