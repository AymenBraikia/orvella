import { unstable_cache } from "next/cache";
import { items_collection } from "../db/collections";
import { Item } from "@/types/item";

const options = { projection: { _id: 0 } };

async function query_item(slug: string): Promise<Item | null> {
    return (await items_collection()).findOne({ slug }, options);
}

const get_item = (slug: string) =>
    unstable_cache(query_item, ["item", slug], {
        revalidate: 3600,
        tags: ["watches", "items", `item:${slug}`],
    })(slug);

export default get_item;
