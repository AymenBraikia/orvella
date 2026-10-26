import "server-only";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";
import { routing } from "@/i18n/routing";
import { absolute_url, BASE_URL } from "./site_url";
import { DEMO_MODE } from "./demo";

/** hreflang alternates for a path that exists in every locale (path without the locale prefix). */
export function language_alternates(path: string, locale: string): NonNullable<Metadata["alternates"]> {
    const suffix = path == "/" ? "" : path;
    return {
        canonical: `/${locale}${suffix}`,
        languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${suffix}`])), "x-default": `/${routing.defaultLocale}${suffix}` },
    };
}

/**
 * Site-wide defaults shared by the storefront layouts. A real shop is described with its own name
 * and the translated meta texts; the public demo is marked as a concept and kept out of search.
 */
export async function site_metadata(locale: string): Promise<Metadata> {
    const { store_name } = await store_identity();
    const t = await getTranslations({ locale, namespace: "meta" });

    const title = DEMO_MODE ? "Luxury Watch Platform | Concept by Aymen Braikia" : t("titleDefault");
    const description = DEMO_MODE
        ? "A full-stack luxury watch marketplace concept — consignment, spare parts, appointment booking, and multilingual storefront. Built by Aymen Braikia as a demonstration of production-grade e-commerce architecture."
        : t("description");

    return {
        title: { default: title, template: `%s | ${store_name}` },
        description,
        applicationName: store_name,
        ...(DEMO_MODE ? { authors: [{ name: "Aymen Braikia" }], creator: "Aymen Braikia", publisher: "Aymen Braikia" } : { keywords: t.raw("keywords") as string[] }),
        metadataBase: new URL(BASE_URL),
        alternates: language_alternates("/", locale),
        robots: DEMO_MODE
            ? { index: false, follow: false, googleBot: { index: false, follow: false } }
            : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
        openGraph: {
            title,
            description: DEMO_MODE ? description : t("ogDescription"),
            url: absolute_url(`/${locale}`),
            siteName: store_name,
            images: [{ url: "/banner.png", width: 1200, height: 630, alt: DEMO_MODE ? `${store_name} preview` : t("ogImageAlt") }],
            locale,
            type: "website",
        },
        twitter: { card: "summary_large_image", title, description: DEMO_MODE ? description : t("twitterDescription"), images: ["/banner.png"] },
        icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
        formatDetection: { telephone: false, email: false, address: false },
        category: "ecommerce",
    };
}
