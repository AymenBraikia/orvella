import "server-only";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";
import { routing } from "@/i18n/routing";
import { absolute_url, BASE_URL } from "./site_url";
import { DEMO_MODE } from "./demo";
import { sanitizeRef } from "@/i18n/brand";

/** hreflang alternates for a path that exists in every locale (path without the locale prefix). */
export function language_alternates(path: string, locale: string): NonNullable<Metadata["alternates"]> {
    const suffix = path == "/" ? "" : path;
    return {
        canonical: `/${locale}${suffix}`,
        languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${suffix}`])), "x-default": `/${routing.defaultLocale}${suffix}` },
    };
}

/** The generated share image (see app/api/og), with the demo's ?ref= dealer name when there is one. */
export function share_image(ref?: string | null): string {
    return ref ? `/api/og?ref=${encodeURIComponent(ref)}` : "/api/og";
}

/**
 * Site-wide defaults shared by the storefront layouts. A real shop is described with its own name
 * and the translated meta texts; the public demo is marked as a concept and kept out of search.
 *
 * `url_ref` is ?ref= from the page URL. Link-preview bots never get the ref cookie, so pages that are
 * shared as pitch links (home, /why) pass it in to show the dealer's name in the preview.
 */
export async function site_metadata(locale: string, url_ref?: string | string[]): Promise<Metadata> {
    const identity = await store_identity();
    const ref = DEMO_MODE ? (sanitizeRef(typeof url_ref == "string" ? url_ref : undefined) ?? identity.ref) : undefined;
    const store_name = ref ?? identity.store_name;
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
            images: [{ url: share_image(ref), width: 1200, height: 630, alt: DEMO_MODE ? `${store_name} preview` : t("ogImageAlt") }],
            locale,
            type: "website",
        },
        twitter: { card: "summary_large_image", title, description: DEMO_MODE ? description : t("twitterDescription"), images: [share_image(ref)] },
        icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
        formatDetection: { telephone: false, email: false, address: false },
        category: "ecommerce",
    };
}

/** Title, description, social image and language alternates for a listing page (category, brand…). */
export function page_metadata(locale: string, path: string, title: string, description: string, image?: string): Metadata {
    const url = absolute_url(`/${locale}${path}`);
    const images = image ? [{ url: image.startsWith("http") ? image : `${BASE_URL}${encodeURI(image)}`, alt: title }] : undefined;

    return {
        title,
        description,
        alternates: language_alternates(path, locale),
        openGraph: { title, description, url, type: "website", ...(images ? { images } : {}) },
        twitter: { card: "summary_large_image", title, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
    };
}

/** generateMetadata for the category pages (shop, watches, rings…). */
export function category_metadata(path: string, title_key: string, seo_key: string, image: string) {
    return async ({ params }: { params: Promise<{ local: string }> }): Promise<Metadata> => {
        const { local } = await params;
        const t = await getTranslations({ locale: local });
        return page_metadata(local, path, t(title_key), t(seo_key), image);
    };
}
