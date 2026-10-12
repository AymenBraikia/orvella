import { unstable_cache } from "next/cache";
import { watches_collection } from "@/app/db/collections";
import { Watch } from "@/app/types/watch";

async function query_brand(brand: string): Promise<Watch[]> {
    const data = await (await watches_collection()).find({ brand: { $regex: brand.trim(), $options: "i" } }, { projection: { _id: 0 } }).toArray();
    return JSON.parse(JSON.stringify(data));
}

const get_brand = (brand: string) =>
    unstable_cache(query_brand, ["watches:brand", brand], {
        revalidate: 3600,
        tags: ["watches"],
    })(brand);

export default get_brand;
