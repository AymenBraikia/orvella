import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

import { watches_collection } from "../db/collections";
import type { Watch } from "../types/watch";

const limit = 8;

const get_cached_new = unstable_cache(
    async (ref: string | undefined): Promise<Watch[]> => {
        const collection = await watches_collection();

        const refED = collection
            .find(
                { preview: ref },
                {
                    sort: { _id: -1 },
                    limit,
                    projection: { _id: 0 },
                },
            )
            .toArray();

        return (await refED).length
            ? refED
            : collection
                  .find(
                      { preview: { $exists: false } },
                      {
                          sort: { _id: -1 },
                          limit,
                          projection: { _id: 0 },
                      },
                  )
                  .toArray();
    },
    ["watches:new"],
    {
        revalidate: 3600,
        tags: ["watches"],
    },
);

async function get_new(): Promise<Watch[]> {
    const cookieStore = await cookies();
    const ref = cookieStore.get("ref")?.value;

    const data = await get_cached_new(ref);

    // No ref -> normal new arrivals
    if (!ref) {
        return JSON.parse(JSON.stringify(data));
    }

    // Ref -> show matching preview watches
    const previewed = data.filter((watch) => watch.preview === ref);

    // No matching preview -> fall back to normal new arrivals
    return JSON.parse(JSON.stringify(previewed.length > 0 ? previewed : data));
}

export default get_new;
