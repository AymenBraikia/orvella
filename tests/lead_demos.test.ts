import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { LOCALES } from "@/i18n/locales";
import { MAIN_STOREFRONT, localize_config, public_storefront, store_has, store_href, type DemoStoreSource } from "@/app/(site)/lib/storefront";

/*
 * Lead demos kept as config files (demos/<slug>.json, shown at /<locale>/<slug>): the main store's
 * links must not change, a demo's must stay inside it, and every config must be complete.
 */

vi.mock("@/app/(site)/lib/demo", () => ({ DEMO_MODE: true }));

const CONFIGS = readdirSync("demos")
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
        const source = JSON.parse(readFileSync(`demos/${f}`, "utf8")) as DemoStoreSource;
        return { file: f, source, config: localize_config(source, source.locale) };
    });

describe("storefront links", () => {
    const demo = public_storefront(CONFIGS.find((c) => c.config.slug == "galeria")!.config);

    it("leaves the main store's links as they are", () => {
        for (const path of ["/", "/shop", "/product/x", "/info/terms", "#new", "https://example.com"]) expect(store_href(MAIN_STOREFRONT, path)).toBe(path);
        expect(store_has(MAIN_STOREFRONT, "/checkout")).toBe(true);
    });

    it("keeps a demo's links under its address", () => {
        expect(store_href(demo, "/")).toBe("/tr/galeria");
        expect(store_href(demo, "/shop")).toBe("/tr/galeria/shop");
        expect(store_href(demo, "/product/rolex-submariner#enquire")).toBe("/tr/galeria/product/rolex-submariner#enquire");
        expect(store_href(demo, "#new")).toBe("#new");
        expect(store_href(demo, "https://www.instagram.com/galeriasaat/")).toBe("https://www.instagram.com/galeriasaat/");
        // A path that is already in the demo (a ?redirect= from a demo page) is left as it is.
        expect(store_href(demo, "/tr/galeria/checkout")).toBe("/tr/galeria/checkout");
        expect(store_href(demo, store_href(demo, "/thank_you?order=1"))).toBe("/tr/galeria/thank_you?order=1");
        expect(store_href(public_storefront(CONFIGS[0].config, "en"), "/shop")).toBe(`/en/${CONFIGS[0].config.slug}/shop`);
    });

    it("gives a demo every store page but the stock it does not have", () => {
        for (const path of ["/", "/shop", "/watches", "/product/x", "/brand/rolex", "/brand/Rolex", "/brand/iwc", "/sell", "/booking", "/store", "/polish", "/consultation", "/info/terms", "/info/payments", "/cart", "/checkout", "/thank_you", "/auth/sign_up"]) expect(store_has(demo, path)).toBe(true);
        for (const path of ["/spare", "/rings", "/bracelets", "/necklaces", "/brand/omega", "/why"]) expect(store_has(demo, path)).toBe(false);
    });
});

describe("demo configs", () => {
    it("exist", () => expect(CONFIGS.length).toBeGreaterThan(0));

    for (const { file, source, config } of CONFIGS) {
        it(`${file} is complete and only uses files that exist`, () => {
            expect(`${config.slug}.json`).toBe(file);
            expect(LOCALES).toContain(config.locale);
            expect(config.instagram).toMatch(/^[A-Za-z0-9._]{1,30}$/);
            expect(config.label.length).toBeGreaterThan(0);
            expect(config.pieces.length).toBeGreaterThan(0);

            const files = [config.logo.src, config.logo_icon.src, config.logo_horizontal?.src, config.favicon, config.hero.poster, config.hero.video, config.hero.desktop_image, ...config.pieces.flatMap((p) => p.images)].filter(Boolean) as string[];
            for (const src of files) {
                expect(src.startsWith(`/demos/${config.slug}/`), src).toBe(true);
                expect(existsSync(`public${src}`), src).toBe(true);
            }

            const slugs = config.pieces.map((p) => p.slug);
            expect(new Set(slugs).size).toBe(slugs.length);
            for (const piece of config.pieces) {
                expect(piece.slug).toMatch(/^[a-z0-9-]+$/);
                expect(piece.images.length).toBeGreaterThan(0);
                expect(Object.keys(piece).sort()).toEqual(expect.arrayContaining(["brand", "description", "images", "model", "slug"]));
                for (const key of Object.keys(piece)) expect(["slug", "brand", "model", "price", "description", "images", "collection", "dial", "details", "note"]).toContain(key);
            }
            for (const piece of source.pieces) {
                if (piece.collection) expect(source.collections?.items.map((c) => c.key)).toContain(piece.collection);
            }
        });
    }
});

describe("demo stock", async () => {
    const { load_demo } = await import("@/app/server/storefront");

    it("has a price for every piece (it is imported as store products by scripts/create-demo.ts)", () => {
        for (const { config } of CONFIGS) for (const piece of config.pieces) expect(piece.price, piece.slug).toBeGreaterThan(0);
    });

    it("loads no config for an unknown or unsafe address", async () => {
        expect((await load_demo("galeria"))?.slug).toBe("galeria");
        expect(await load_demo("nope")).toBeNull();
        expect(await load_demo("../package")).toBeNull();
    });
});

describe("demo texts per language", () => {
    const { source } = CONFIGS.find((c) => c.config.slug == "galeria")!;

    it("shows each text in the page's language, English for the others", () => {
        const tr = localize_config(source, "tr");
        const en = localize_config(source, "en");
        const de = localize_config(source, "de");
        expect(tr.label).toMatch(/Özel demo/);
        expect(en.label).toMatch(/Private demo/);
        expect(de.label).toBe(en.label);
        const cartier = (c: typeof tr) => c.pieces.find((p) => p.slug == "cartier-santos-dumont")!;
        expect(cartier(tr).dial).toBe("Şampanya");
        expect(cartier(en).dial).toBe("Champagne");
        expect(cartier(tr).description).not.toBe(cartier(en).description);
        // A piece's collection becomes that collection's name, in the same language as the cards.
        expect(cartier(en).collection).toBe("Classic");
        expect(en.collections?.items.map((c) => c.name)).toContain("Classic");
    });
});
