import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/*
 * ?ref= renames the store on the demo. On a dealer's shop it must do nothing at all: a shared link
 * could otherwise show a fake name and email next to the bank details for 30 days.
 */

const state = vi.hoisted(() => ({ demo: false, cookies: new Map<string, string>(), save_visit: vi.fn() }));

const ITEMS = [
    { slug: "public-1", price: 1000, quantity: 1, reservations: [], type: "watch" },
    { slug: "preview-1", price: 1000, quantity: 1, reservations: [], type: "watch", preview: "Fake Watches" },
];

vi.mock("@/app/(site)/lib/demo", () => ({
    get DEMO_MODE() {
        return state.demo;
    },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined) }) }));
vi.mock("next/cache", () => ({ unstable_cache: <T,>(fn: T) => fn, revalidateTag: () => {}, revalidatePath: () => {} }));
vi.mock("../app/server/settings", () => {
    const DEFAULT_SETTINGS = { store_name: "Real Dealer", email: "shop@realdealer.de" };
    return { DEFAULT_SETTINGS, get_settings: async () => DEFAULT_SETTINGS };
});
vi.mock("../app/db/collections", () => ({
    items_collection: async () => ({
        find: (query: { preview?: unknown }) => ({
            toArray: async () => ITEMS.filter((i) => (!("preview" in query) ? true : typeof query.preview == "string" ? i.preview === query.preview : i.preview === undefined)),
        }),
    }),
}));
vi.mock("../app/server/save_visit", () => ({ save_visit: state.save_visit }));
vi.mock("../app/[local]/(auth)/auth/jwt", () => ({ verifyJwt: () => null }));
vi.mock("../i18n/routing", () => ({ routing: { locales: ["en"], defaultLocale: "en" } }));
vi.mock("next-intl/middleware", async () => {
    const { NextResponse } = await import("next/server");
    return { default: () => () => NextResponse.next() };
});

const { store_identity, brand_for_messages } = await import("@/app/server/store_identity");
const { default: get_items } = await import("@/app/server/get_items");
const { default: get_new } = await import("@/app/server/get_new");
const { default: proxy } = await import("../proxy");

const slugs = (items: { slug: string }[]) => items.map((i) => i.slug);
const visit = (url: string) => proxy(new NextRequest(url, { headers: { "user-agent": "Mozilla/5.0" } }));

beforeEach(() => {
    state.demo = false;
    state.cookies.clear();
    state.save_visit.mockClear();
    vi.stubEnv("NODE_ENV", "production");
});

describe("DEMO_MODE off (a dealer's shop)", () => {
    beforeEach(() => {
        state.cookies.set("ref", "Fake Watches");
    });

    it("an existing ref cookie does not change the store name or email", async () => {
        const store = await store_identity();
        expect(store.store_name).toBe("Real Dealer");
        expect(store.email).toBe("shop@realdealer.de");
        expect(store.ref).toBeUndefined();
    });

    it("the ref cookie does not reach the translations", async () => {
        expect(await brand_for_messages()).toBe("Real Dealer");
    });

    it("the ref cookie does not select preview pieces", async () => {
        expect(slugs(await get_items())).toEqual(["public-1"]);
        expect(slugs(await get_new())).toEqual(["public-1"]);
    });

    it("?ref= sets no cookie and stores no visitor", () => {
        const response = visit("https://dealer.test/en?ref=Fake%20Watches");
        expect(response.cookies.get("ref")).toBeUndefined();
        expect(state.save_visit).not.toHaveBeenCalled();
    });
});

describe("DEMO_MODE on (the pitch demo)", () => {
    beforeEach(() => {
        state.demo = true;
    });

    it("?ref= sets the cookie and records the visit", () => {
        const response = visit("https://demo.test/en?ref=Fake%20Watches");
        expect(response.cookies.get("ref")?.value).toBe("Fake Watches");
        expect(state.save_visit).toHaveBeenCalledOnce();
    });

    it("the ref cookie renames the store and shows its preview pieces", async () => {
        state.cookies.set("ref", "Fake Watches");
        expect((await store_identity()).store_name).toBe("Fake Watches");
        expect(await brand_for_messages()).toBe("Fake Watches");
        expect(slugs(await get_items())).toEqual(["preview-1"]);
        expect(slugs(await get_new())).toEqual(["preview-1"]);
    });
});
