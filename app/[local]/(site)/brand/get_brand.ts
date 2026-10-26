import { unstable_cache } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { Item } from "@/types/item";
import { to_public_item } from "../lib/stock";
import { escape_regex } from "../lib/escape_regex";

async function query_brand(brand: string): Promise<Item[]> {
    const data = await (await items_collection()).find({ brand: { $regex: escape_regex(brand.trim()), $options: "i" }, deleted: { $ne: true } }, { projection: { _id: 0 } }).toArray();
    return JSON.parse(JSON.stringify(data));
}

const get_cached_brand = (brand: string) =>
    unstable_cache(query_brand, ["watches:brand", brand], {
        revalidate: 3600,
        tags: ["watches", "items"],
    })(brand);

export default async function get_brand(brand: string): Promise<Item[]> {
    const now = Date.now();
    return (await get_cached_brand(brand)).map((item) => to_public_item(item, now));
}
