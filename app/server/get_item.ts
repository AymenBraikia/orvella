import { unstable_cache } from "next/cache";
import { Watch } from "@/types/watch";
import { spares_collection, watches_collection } from "../db/collections";
import type { Spare } from "../types/spare";

const options = { projection: { _id: 0 } };

async function query_item(slug: string): Promise<Spare | Watch> {
    const data = (await (await watches_collection()).findOne({ slug }, options)) || (await (await spares_collection()).findOne({ slug }, options));
    return data!;
}

const get_item = (slug: string) =>
    unstable_cache(query_item, ["item", slug], {
        revalidate: 3600,
        tags: ["watches", "spares", `item:${slug}`],
    })(slug);

export default get_item;
