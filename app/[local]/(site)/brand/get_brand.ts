import { unstable_cache } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { Item } from "@/types/item";
import { to_public_item } from "../lib/stock";
import { escape_regex } from "../lib/escape_regex";
import { active_ref } from "@/app/server/ref";
import { is_demo_ref } from "@/app/server/private_demos";

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
    const ref = await active_ref();
    // A private demo's visitor sees only the seller's pieces; a pitch ref also sees the store's.
    const own_only = await is_demo_ref(ref);
    return (await get_cached_brand(brand)).filter((item) => (own_only ? item.preview == ref : !item.preview || item.preview == ref)).map((item) => to_public_item(item, now));
}
