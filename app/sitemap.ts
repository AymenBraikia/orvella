import type { MetadataRoute } from "next";
import get_items from "./server/get_items";

import { BASE_URL } from "@/app/(site)/lib/site_url";

const baseUrl = BASE_URL;

const locales = ["en", "de", "es", "ar", "it", "tr", "fr"] as const;

const routes = [
    "",
    "/shop",
    "/spare",
    "/sell",
    "/polish",
    "/store",
    "/booking",

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const watches = (await get_items()).filter((e) => e.type == "watch");

    const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        routes.map((route) => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: now,
            changeFrequency: route === "" ? "daily" : "weekly",
            priority: route === "" ? 1 : ["/shop", "/spare"].includes(route) ? 0.9 : 0.7,
        })),
    );

    const brandPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        watches.map((w) => ({
            url: `${baseUrl}/${locale}/brand/${w.brand}`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    );

    return [...staticPages, ...brandPages];
}
