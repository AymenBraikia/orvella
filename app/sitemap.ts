import type { MetadataRoute } from "next";
import get_watches from "./server/get_watches";

const baseUrl = "https://arvell.vercel.app";

const locales = ["en", "de"] as const;

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
    "/info/polishing",
    "/info/terms",
    "/info/vacancies",
    "/info/withdraw",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const watches = await get_watches();

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
