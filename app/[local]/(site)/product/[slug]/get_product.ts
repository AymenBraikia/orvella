import { unstable_cache } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { Item } from "@/types/item";
import { to_public_item } from "../../lib/stock";
import { escape_regex } from "../../lib/escape_regex";

async function query_product(slug: string): Promise<Item | null> {
    const items = await items_collection();
    const options = { projection: { _id: 0 } };

    const data = (await items.findOne({ slug, deleted: { $ne: true } }, options)) ?? (await items.findOne({ slug: { $regex: `^${escape_regex(slug)}$`, $options: "i" }, deleted: { $ne: true } }, options));

    return JSON.parse(JSON.stringify(data));
}

const get_cached_product = (slug: string) =>
    unstable_cache(query_product, ["watches:product", slug], {
        revalidate: 3600,
        tags: ["watches", "items", `item:${slug}`, `watch:${slug}`],
    })(slug);

/** The product as the storefront may see it (stock resolved, reservations removed). */
export default async function get_product(slug: string): Promise<Item | null> {
    const data = await get_cached_product(slug);
    return data ? to_public_item(data) : null;
}
