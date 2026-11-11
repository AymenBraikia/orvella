import { LOCALES } from "@/i18n/locales";

/*
 * Private demos live at the top level (corlane.store/dn), next to the site's own pages. These
 * first path segments belong to the site and can never be a demo slug. tests/private_demos.test.ts
 * checks that every route folder and public folder is listed here.
 */
const SITE_SEGMENTS = [
    // app/[local]/…
    "admin", "auth", "booking", "bracelets", "brand", "cart", "checkout", "consultation", "info", "necklaces", "polish",
    "product", "rings", "sell", "shop", "spare", "store", "thank_you", "watches", "why", "d",
    // app/… and the proxy's own redirect target
    "api", "paypal", "llms.txt", "robots.txt", "sitemap.xml", "favicon.ico", "not_found", "not-found", "_next",
    // code folders under app/ (no pages, reserved anyway)
    "components", "context", "lib", "db", "server", "types",
    // public/…
    "brands", "new", "previews", "spares", "uploads", "dev-uploads",
    // words that would look like part of the site
    "demo", "demos", "home", "login", "logout", "signup", "account", "corlane", "orvella", "arvell",
];

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([...SITE_SEGMENTS, ...LOCALES]);

/** Lowercase letters, digits and single hyphens, 2–40 characters: "dn", "maison-dubois". */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,39}$/;

/** Why `slug` cannot be used for a demo, or null if it can. */
export function slug_problem(slug: string): string | null {
    if (!SLUG_PATTERN.test(slug)) return "Use 2–40 lowercase letters, digits or hyphens (no hyphen at the start or end).";
    if (RESERVED_SLUGS.has(slug)) return "This address is used by the site itself. Pick another one.";
    return null;
}

/**
 * The demo slug in a request path ("/dn"), or null when the path belongs to the site. Says nothing
 * about whether the demo exists; app/api/demo-open answers that with a 404.
 */
export function demo_slug_of(pathname: string): string | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length != 1) return null;
    return slug_problem(segments[0]) ? null : segments[0];
}
