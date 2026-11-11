import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import type { Locales } from "@/types/locales";
import type { Metadata } from "next";
import { BASE_URL } from "@/app/(site)/lib/site_url";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { MAIN_STOREFRONT, localize_config, public_storefront, store_has, store_href, type DemoStoreConfig, type DemoStoreSource, type Storefront } from "@/app/(site)/lib/storefront";
import type { Item } from "@/types/item";
import { LOCALES } from "@/i18n/locales";
import { brand_name } from "@/app/(site)/lib/brand_name";

/*
 * Private lead demos: a config file (demos/<slug>.json + public/demos/<slug>/) for the seller's
 * identity and presentation, shown by the store's own pages at /<locale>/<slug>/…
 * (app/[local]/(demo)/[demo]). Their watches are real store products, imported from the same file
 * with scripts/create-demo.ts (a private demo tagged with the seller's name), so the cart, checkout,
 * enquiries and accounts work as in the store. Each demo page calls
 * enter_demo() with its URL params first; the store's server code then asks current_demo() which
 * store it is rendering. Demos exist on the Corlane demo deployment only (DEMO_MODE).
 */

const SLUG = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,39}$/;

/** The demo config file at `slug` (texts per language), or null. */
export const load_demo = cache(async (slug: string): Promise<DemoStoreSource | null> => {
    if (!DEMO_MODE || typeof slug != "string" || !SLUG.test(slug)) return null;
    try {
        const config = (await import(`@/demos/${slug}.json`)).default as DemoStoreSource;
        return config.slug == slug && (LOCALES as readonly string[]).includes(config.locale) ? config : null;
    } catch {
        return null;
    }
});

/** The demo this request renders (set by enter_demo). Per request, like next-intl's setRequestLocale. */
const request_store = cache((): { demo: DemoStoreConfig | null; locale: Locales | null } => ({ demo: null, locale: null }));

/**
 * Called first by every demo layout, page and generateMetadata. Returns the demo, or null when there
 * is no demo at that address (the page then shows the store's 404). It works in every language,
 * like the store (`rest`, the path after the demo's address, is kept for callers).
 */
export async function enter_demo(params: Promise<{ local: string; demo: string }>, rest?: string): Promise<DemoStoreConfig | null> {
    void rest;
    const { local, demo: slug } = await params;
    const source = await load_demo(slug);
    if (!source || !(LOCALES as readonly string[]).includes(local)) return null;
    // In the page's language (each text falls back to English, then the demo's own language).
    const demo = localize_config(source, local as Locales);
    request_store().demo = demo;
    request_store().locale = local as Locales;
    return demo;
}

/** Like enter_demo, for pages: a 404 when there is no demo at that address. */
export async function require_demo(params: Promise<{ local: string; demo: string }>, rest: string): Promise<DemoStoreConfig> {
    return (await enter_demo(params, rest)) ?? notFound();
}

/** The demo being rendered, or null for the main store. */
export function current_demo(): DemoStoreConfig | null {
    return request_store().demo;
}

/**
 * One of the demo's products in the page's language: its name, description, collection and dial from
 * the config (the database keeps the demo's own language).
 */
export function localize_item<T extends Item>(demo: DemoStoreConfig, item: T): T {
    const piece = demo.pieces.find((p) => item.slug == `${demo.slug}-${p.slug}`);
    // Demo products are watches (search results only carry some fields, without the type).
    if (!piece) return item;
    return {
        ...item,
        model: piece.model,
        display_name: `${brand_name(piece.brand)} ${piece.model}`,
        description: piece.description,
        ...(piece.collection ? { collection: piece.collection } : {}),
        ...(piece.dial ? { dialColor: piece.dial } : {}),
    };
}

export function current_storefront(): Storefront {
    const demo = current_demo();
    return demo ? public_storefront(demo, request_store().locale ?? demo.locale) : MAIN_STOREFRONT;
}

/** A store link for the page being rendered (see store_href). */
export function server_href(path: string): string {
    return store_href(current_storefront(), path);
}

export function server_has(path: string): boolean {
    return store_has(current_storefront(), path);
}


/**
 * A demo page's metadata: never indexed or followed, the seller's name and favicon, and a share
 * preview with their own picture. `page` is a product (or another page) of the demo.
 */
export function demo_metadata(demo: DemoStoreConfig, page?: { title: string; description: string; image?: string }): Metadata {
    const title = page ? `${page.title} | ${demo.name}` : demo.name;
    const description = page?.description ?? demo.description;
    const image = page?.image ?? demo.hero.desktop_image ?? demo.hero.poster;
    return {
        metadataBase: new URL(BASE_URL),
        title: { absolute: title },
        description,
        applicationName: demo.name,
        robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
        icons: { icon: demo.favicon, apple: demo.logo_icon.src },
        openGraph: { title, description, siteName: demo.name, type: "website", locale: demo.locale, images: [{ url: image, alt: title }] },
        twitter: { card: "summary_large_image", title, description, images: [image] },
        formatDetection: { telephone: false, email: false, address: false },
    };
}

/** A demo's brands for the brand cards: each with the photo of its first piece. */
export function demo_brands(demo: DemoStoreConfig): { id: number; name: string; src: string }[] {
    const seen = new Map<string, { id: number; name: string; src: string }>();
    for (const piece of demo.pieces) {
        const key = piece.brand.trim().toLowerCase();
        if (!seen.has(key) && piece.images[0]) seen.set(key, { id: seen.size, name: brand_name(piece.brand), src: piece.images[0] });
    }
    return [...seen.values()];
}
