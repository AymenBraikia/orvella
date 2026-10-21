import { unstable_cache } from "next/cache";
import { items_collection } from "../db/collections";
import { BaseItem } from "@/types/item";

const options = { projection: { _id: 0 } };

async function query_item(slug: string): Promise<BaseItem> {
    const data = await (await items_collection()).findOne({ slug }, options);
    return data!;
}

const get_item = (slug: string) =>
    unstable_cache(query_item, ["item", slug], {
        revalidate: 3600,
        tags: ["watches", "spares", `item:${slug}`],
    })(slug);

export default get_item;
