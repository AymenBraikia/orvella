import { unstable_cache } from "next/cache";
import { watches_collection } from "@/app/db/collections";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Watch } from "@/types/watch";

const SEARCH_PROJECTION = { _id: 0, slug: 1, brand: 1, model: 1, reference: 1, price: 1, images: { $slice: 1 } } as const;

async function query_search(query: string) {
    const data = await (
        await watches_collection()
    )
        .find({ $or: [{ brand: { $regex: query, $options: "i" } }, { model: { $regex: query, $options: "i" } }, { reference: { $regex: query, $options: "i" } }] }, { projection: SEARCH_PROJECTION })
        .limit(10)
        .toArray();
    return JSON.parse(JSON.stringify(data));
}

const search_watches = (query: string) =>
    unstable_cache(query_search, ["watches:search", query], {
        revalidate: 300,
        tags: ["watches"],
    })(query);

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase();

    if (!query) return NextResponse.json([]);

    const watches = await search_watches(query);

    const cookieStore = await cookies();
    const ref = cookieStore.get("ref")?.value;

    if (!ref || !watches.find((e: Watch) => e.preview == ref))
        return NextResponse.json(
            watches.filter((e:Watch) => e.preview == undefined),
            {
                headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
            },
        );
    else
        return NextResponse.json(
            watches.filter((e: Watch) => e.preview == ref),
            {
                headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
            },
        );
}
