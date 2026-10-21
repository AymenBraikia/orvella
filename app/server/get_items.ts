import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

import { items_collection } from "../db/collections";
import { Item } from "@/types/item";

// The card grid never reads these, but you're currently shipping them for
// every watch on every request.
const CARD_PROJECTION = {
    _id: 0,
    slug: 1,
    brand: 1,
    brandSlug: 1,
    model: 1,
    reference: 1,
    year: 1,
    price: 1,
    condition: 1,
    movement: 1,
    caseMaterial: 1,
    caseDiameterMm: 1,
    braceletMaterial: 1,
    dialColor: 1,
    waterResistanceM: 1,
    boxPapers: 1,
    inStock: 1,
    date_added: 1,
    relevance_score: 1,
    images: { $slice: 1 },
    video: 1,

    length: 1,
    length_unit: 1,
    clasp_type: 1,
    ring_size: 1,
    band_width: 1,
    display_name: 1,
    
    weight: 1,
    measurement_unit: 1,
    metal_type: 1,
    fineness: 1,
    karats: 1,
    stones: 1,
    type: 1,
    // Needed because the result is filtered by preview
    preview: 1,
} as const;

/**
 * Pure database/cache layer.
 *
 * IMPORTANT:
 * No cookies(), headers(), searchParams, etc. inside this function.
 */
const get_cached_items = unstable_cache(
    async (): Promise<Item[]> => {
        const collection = await items_collection();

        return collection.find({}, { projection: CARD_PROJECTION }).toArray();
    },
    ["watches:all"],
    {
        revalidate: 3600,
        tags: ["watches"],
    },
);

/**
 * Request-specific layer.
 *
 * cookies() lives OUTSIDE the cache scope.
 */
async function get_items(): Promise<Item[]> {
    const cookieStore = await cookies();
    const ref = cookieStore.get("ref")?.value;

    const data = await get_cached_items();

    // No ref cookie => return all watches.
    if (!ref) {
        return JSON.parse(JSON.stringify(data.filter((e) => e.preview == undefined)));
    }

    // Ref cookie => only return watches belonging to that preview.
    const previewed = data.filter((watch) => watch.preview === ref);

    return JSON.parse(JSON.stringify(previewed.length ? previewed : data.filter((e) => e.preview == undefined)));
}

export default get_items;
