import { unstable_cache } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { NextRequest, NextResponse } from "next/server";
import { active_ref } from "@/app/server/ref";
import { Item } from "@/app/(site)/lib/filters";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import type { Document } from "mongodb";

const SEARCH_PROJECTION = { _id: 0, slug: 1, brand: 1, model: 1, reference: 1, price: 1, images: { $slice: 1 }, display_name: 1, preview: 1 } as const;

async function query_search(query: string, ref: string | undefined) {
    const rx = { $regex: escape_regex(query), $options: "i" };
    // In the query rather than afterwards, so hidden pieces can't use up the limit.
    const visible: Document = { deleted: { $ne: true }, preview: { $in: ref ? [ref, null] : [null] }, $or: [{ brand: rx }, { model: rx }, { reference: rx }, { display_name: rx }] };

    const data = await (await items_collection()).find(visible, { projection: SEARCH_PROJECTION }).limit(10).toArray();
    return JSON.parse(JSON.stringify(data));
}

const search_items = (query: string, ref: string | undefined) =>
    unstable_cache(query_search, ["items:search", query, ref ?? ""], {
        revalidate: 300,
        tags: ["items"],
    })(query, ref);

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase().slice(0, 100);

    if (!query) return NextResponse.json([]);

    const ref = await active_ref();
    const items: Item[] = await search_items(query, ref);

    // What a ?ref= visitor sees depends on a cookie, so the demo's answers must not sit in a shared cache.
    const cache_control = DEMO_MODE ? "private, no-store" : "public, s-maxage=300, stale-while-revalidate=3600";

    const previewed = ref ? items.filter((e) => e.preview == ref) : [];
    return NextResponse.json(previewed.length ? previewed : items.filter((e) => e.preview == undefined), { headers: { "Cache-Control": cache_control } });
}
