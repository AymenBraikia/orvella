import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { items_collection } from "./db/collections";
import { BASE_URL } from "@/app/(site)/lib/site_url";
import { routing } from "@/i18n/routing";

const locales = routing.locales;

const routes = [
    "",
    "/shop",
    "/watches",
    "/rings",
    "/bracelets",
    "/necklaces",
    "/spare",
    "/sell",
    "/polish",
    "/store",
    "/booking",
    "/consultation",

    "/info/about",
    "/info/cookies",
    "/info/disclaimer",
    "/info/faq",
    "/info/imprint",
    "/info/payments",
    "/info/policy",
    "/info/terms",
    "/info/vacancies",
    "/info/withdraw",
] as const;

/** Public catalogue for the sitemap: no deleted pieces, no ?ref= preview-only pieces. */
const sitemap_items = unstable_cache(
    async () => {
        const docs = await (await items_collection())
            .find({ deleted: { $ne: true }, preview: { $exists: false } }, { projection: { _id: 0, slug: 1, brand: 1, date_added: 1, updated_at: 1 } })
            .toArray();
        return JSON.parse(JSON.stringify(docs)) as { slug: string; brand?: string; date_added: string; updated_at?: string }[];
    },
    ["sitemap:items"],
    { revalidate: 3600, tags: ["watches", "items"] },
);

/** One entry per URL, with every language version listed as an alternate (hreflang). */
function localized(path: string, extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">): MetadataRoute.Sitemap {
    const languages = Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`]));
    return locales.map((locale) => ({ url: `${BASE_URL}/${locale}${path}`, alternates: { languages }, ...extra }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const items = await sitemap_items();

    const static_pages = routes.flatMap((route) =>
        localized(route, {
            lastModified: now,
            changeFrequency: route === "" ? "daily" : "weekly",
            priority: route === "" ? 1 : ["/shop", "/watches", "/spare"].includes(route) ? 0.9 : 0.7,
        }),
    );

    const product_pages = items.flatMap((item) => localized(`/product/${encodeURIComponent(item.slug)}`, { lastModified: new Date(item.updated_at ?? item.date_added), changeFrequency: "weekly", priority: 0.8 }));

    // Brand pages: one per brand, last changed when any of its pieces changed.
    const brands = new Map<string, Date>();
    for (const item of items) {
        if (!item.brand) continue;
        const key = item.brand.trim().toLowerCase();
        const changed = new Date(item.updated_at ?? item.date_added);
        if (!brands.has(key) || brands.get(key)! < changed) brands.set(key, changed);
    }
    const brand_pages = [...brands].flatMap(([brand, lastModified]) => localized(`/brand/${encodeURIComponent(brand)}`, { lastModified, changeFrequency: "weekly", priority: 0.7 }));

    return [...static_pages, ...product_pages, ...brand_pages];
}
