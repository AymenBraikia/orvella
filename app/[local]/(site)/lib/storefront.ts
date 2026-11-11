import type { Locales } from "@/types/locales";
import { LOCALES } from "@/i18n/locales";
import { brand_name } from "./brand_name";

/*
 * Which store a page shows. The main store is the default; a private lead demo (demos/<slug>.json,
 * opened at /<locale>/<slug>) is the same storefront with the seller's name, logo, hero and stock,
 * and its own texts (per language). The demo is picked by the URL, never by a cookie.
 */

type ImageAsset = { src: string; width: number; height: number };

/** A text of the config: one string, or one per language ({ "tr": "…", "en": "…" }). */
export type Localized = string | Partial<Record<Locales, string>>;

/** demos/<slug>.json: everything that differs between a lead's demo and the main store. `Text`: see below. */
interface DemoStore<Text> {
    slug: string;
    /** Where corlane.store/<slug> opens. The demo works in every language. */
    locale: Locales;
    name: string;
    /** Instagram handle without the @ (footer). */
    instagram?: string;
    /** WhatsApp number, digits with country code (footer, product pages). */
    whatsapp?: string;
    /** Replaces the store's gold (taken from the seller's logo). */
    accent?: string;
    /** "dark" keeps the site dark and hides the theme switch (for a logo made for a dark background). */
    theme?: "dark";
    /** The private-demo strip shown on every page. */
    label: Text;
    footer_note: Text;
    description: Text;
    logo: ImageAsset;
    logo_icon: ImageAsset;
    /** A wide version (icon and name side by side), for the footer. */
    logo_horizontal?: ImageAsset;
    favicon: string;
    hero: { title: Text; subtitle: Text; poster: string; video?: string; desktop_image?: string };
    new_arrivals?: { heading?: Text; subtext?: Text };
    /** The line under the brand cards (the store's own is about its collection). */
    brands_subtext?: Text;
    /** The category cards under the hero: one per collection, each opening the shop filtered to it. */
    collections?: { heading: Text; subtext: Text; items: { key: string; name: Text; image: string }[] };
    /** The background of the trade-in section (the store's own is a photo of its jewelry). */
    trade_image?: string;
    /** The page banners (shop, cart, checkout…): a photo for the light theme and one for the dark. */
    banner?: { light: string; dark: string };
    /** The store page, footer and About page. */
    store?: { address: { street: string; postcode: string; city: string; country: string }; opening_hours: Record<string, string>; about: Text };
    pieces: DemoStorePiece<Text>[];
}

/** A watch of the seller. Only what the photos show: everything else stays unknown and is not shown. */
export interface DemoStorePiece<Text = string> {
    slug: string;
    brand: string;
    model: Text;
    /** In EUR, like every store price (shown in the visitor's currency). Missing: "price on request". */
    price?: number;
    description: Text;
    images: string[];
    /** The key of one of the config's collections (a shop filter); in a resolved config, its name. */
    collection?: string;
    /** The dial colour (a shop filter and product detail). */
    dial?: Text;
    /** The product details (reference, year, movement, case, size, bracelet, condition, box and papers…), as in the admin's demo form. */
    details?: Record<string, string | number | boolean>;
    /** More photos for the product page, used by the import (scripts/create-demo.ts) only: paths from the project root. */
    import_photos?: string[];
    /** Corrected by hand: scripts/build-lead-demo.ts keeps it as it is. */
    locked?: boolean;
    /** For whoever edits the config; never shown. */
    note?: string;
}

/** The file as it is: texts per language. */
export type DemoStoreSource = DemoStore<Localized>;
/** The file in one language (what a page uses). */
export type DemoStoreConfig = DemoStore<string>;

/** The config in `locale`: each text in that language, else English, else the demo's own language. */
export function localize_config(source: DemoStoreSource, locale: Locales): DemoStoreConfig {
    const pick = (text: Localized): string => (typeof text == "string" ? text : (text[locale] ?? text.en ?? text[source.locale] ?? Object.values(text)[0] ?? ""));
    const maybe = (text?: Localized) => (text === undefined ? undefined : pick(text));
    const collections = source.collections && { heading: pick(source.collections.heading), subtext: pick(source.collections.subtext), items: source.collections.items.map((c) => ({ ...c, name: pick(c.name) })) };
    const collection_name = (key?: string) => (key === undefined ? undefined : (collections?.items.find((c) => c.key == key)?.name ?? key));

    return {
        ...source,
        label: pick(source.label),
        footer_note: pick(source.footer_note),
        description: pick(source.description),
        hero: { ...source.hero, title: pick(source.hero.title), subtitle: pick(source.hero.subtitle) },
        new_arrivals: source.new_arrivals && { heading: maybe(source.new_arrivals.heading), subtext: maybe(source.new_arrivals.subtext) },
        brands_subtext: maybe(source.brands_subtext),
        store: source.store && { ...source.store, about: pick(source.store.about) },
        collections,
        pieces: source.pieces.map((p) => ({ ...p, model: pick(p.model), description: pick(p.description), dial: maybe(p.dial), collection: collection_name(p.collection) })),
    };
}

/** What the browser needs to know about the store it is showing. */
export interface Storefront {
    demo?: {
        slug: string;
        locale: Locales;
        name: string;
        label: string;
        footer_note: string;
        instagram_url: string;
        logo: ImageAsset;
        logo_icon: ImageAsset;
        logo_horizontal?: ImageAsset;
        /** A wide picture of the seller's (for pages that show one, like the 404). */
        image: string;
        /** For the menu and footer: the demo's collections and brands, as store paths. */
        collections_heading?: string;
        collections: { label: string; path: string }[];
        brands: { label: string; path: string }[];
        forced_theme?: "dark";
    };
}

export const MAIN_STOREFRONT: Storefront = {};

/**
 * What a demo does not have: the admin, the Corlane pitch, and the store's stock the seller does not
 * carry (spare parts, jewelry; brand pages only for the seller's own brands). Every other store page,
 * cart, checkout and accounts included, is in the demo, under its address.
 */
const DEMO_EXCLUDED = ["/admin", "/why", "/spare", "/rings", "/bracelets", "/necklaces"];

/** `locale`: the language the page is shown in (links stay in it); the config's is where /<slug> opens. */
export function public_storefront(config: DemoStoreConfig, locale: Locales = config.locale): Storefront {
    return {
        demo: {
            slug: config.slug,
            locale,
            name: config.name,
            label: config.label,
            footer_note: config.footer_note,
            instagram_url: config.instagram ? instagram_url(config.instagram) : "",
            logo: config.logo,
            logo_icon: config.logo_icon,
            logo_horizontal: config.logo_horizontal,
            image: config.hero.desktop_image ?? config.hero.poster,
            collections_heading: config.collections?.heading,
            collections: (config.collections?.items ?? []).map((c) => ({ label: c.name, path: collection_path(c.name) })),
            brands: [...new Set(config.pieces.map((p) => p.brand.trim().toLowerCase()))].map((b) => ({ label: brand_name(b), path: `/brand/${encodeURIComponent(b)}` })),
            forced_theme: config.theme,
        },
    };
}

/** The shop filtered to one collection (the "collection" shop filter). */
export function collection_path(name: string): string {
    return `/shop?collection=${encodeURIComponent(name)}`;
}

export function instagram_url(handle: string): string {
    return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

/** Whether the store has this page ("/shop", "/product/x", "/info/terms"…). The main store has them all. */
export function store_has(store: Storefront, path: string): boolean {
    if (!store.demo) return true;
    const page = path.split(/[?#]/)[0];
    if (DEMO_EXCLUDED.some((p) => page == p || page.startsWith(`${p}/`))) return false;
    if (page.startsWith("/brand/")) return store.demo.brands.some((b) => decoded(b.path) == decoded(page));
    return true;
}

/**
 * A store link. The main store's links stay as they are ("/shop"; the locale is added by the
 * proxy); a demo's always carry its locale and address ("/tr/galeria/shop"), so visitors stay in it.
 */
export function store_href(store: Storefront, path: string): string {
    if (!store.demo || !path.startsWith("/")) return path;
    const root = `/${store.demo.locale}/${store.demo.slug}`;
    // Already a demo address (e.g. a ?redirect= that came from a demo page).
    const [, locale, slug] = path.split(/[/?#]/);
    if ((LOCALES as readonly string[]).includes(locale) && slug == store.demo.slug) return path;
    return path == "/" ? root : path.startsWith("/#") || path.startsWith("/?") ? `${root}${path.slice(1)}` : `${root}${path}`;
}

/** "/brand/Rolex", "/brand/rolex" and "/brand/r%6Flex" are the same page. */
function decoded(path: string): string {
    try {
        return decodeURIComponent(path).trim().toLowerCase();
    } catch {
        return path.toLowerCase();
    }
}

