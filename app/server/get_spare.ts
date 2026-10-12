import { unstable_cache } from "next/cache";
import { spares_collection } from "../db/collections";
import type { Spare } from "../types/spare";

async function query_spares(): Promise<Spare[]> {
    const data = await (await spares_collection()).find({}, { projection: { _id: 0 } }).toArray();
    return data;
}

const get_spare_parts = unstable_cache(query_spares, ["spares:all"], {
    revalidate: 3600,
    tags: ["spares"],
});

export default get_spare_parts;
