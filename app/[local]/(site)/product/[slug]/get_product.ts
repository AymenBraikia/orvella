import { unstable_cache } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { Watch } from "@/app/types/watch";

async function query_product(slug: string): Promise<Watch> {
    const data = await (await items_collection()).findOne({ slug: { $regex: slug, $options: "i" } }, { projection: { _id: 0 } });
    return JSON.parse(JSON.stringify(data));
}

const get_product = (slug: string) =>
    unstable_cache(query_product, ["watches:product", slug], {
        revalidate: 3600,
        tags: ["watches", `watch:${slug}`],
    })(slug);

export default get_product;
