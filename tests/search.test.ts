import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection, type Document } from "mongodb";
import { NextRequest } from "next/server";

/* The real search and brand queries against a throwaway MongoDB. */

let server: MongoMemoryServer;
let client: MongoClient;
let items: Collection<Document>;

const state = vi.hoisted(() => ({ demo: false, cookies: new Map<string, string>() }));

vi.mock("@/app/(site)/lib/demo", () => ({
    get DEMO_MODE() {
        return state.demo;
    },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined) }) }));
vi.mock("next/cache", () => ({ unstable_cache: <T,>(fn: T) => fn, revalidateTag: () => {} }));
vi.mock("../app/db/collections", () => ({ items_collection: async () => items }));

const { GET } = await import("@/app/api/search/route");
const { default: get_brand } = await import("@/app/(site)/brand/get_brand");

const search = (query: string) => GET(new NextRequest(`https://shop.test/api/search?query=${encodeURIComponent(query)}`));
const found = async (query: string) => ((await (await search(query)).json()) as { slug: string }[]).map((i) => i.slug).sort();

const watch = (slug: string, extra = {}) => ({ slug, brand: "Rolex", model: "Daytona", reference: "116500", price: 1000, quantity: 1, reservations: [], images: [], type: "watch", ...extra });

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    items = client.db("orvella_test").collection("items");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    state.demo = false;
    state.cookies.clear();
    await items.deleteMany({});
    await items.insertMany([watch("public-1"), watch("removed", { deleted: true }), watch("preview-1", { preview: "Fake Watches" })]);
});

describe("search", () => {
    it("finds public pieces and hides deleted and preview-only ones", async () => {
        expect(await found("daytona")).toEqual(["public-1"]);
    });

    it("preview pieces cannot use up the result limit", async () => {
        await items.insertMany(Array.from({ length: 12 }, (_, i) => watch(`preview-extra-${i}`, { preview: "Fake Watches" })));
        expect(await found("daytona")).toEqual(["public-1"]);
    });

    it("regex characters are plain text: no error, no match-everything pattern", async () => {
        expect((await search("(")).status).toBe(200);
        expect(await found("[")).toEqual([]);
        expect(await found(".*")).toEqual([]);
        expect(await found("(a+)+$")).toEqual([]);
    });

    it("ignores a ref cookie on a dealer's shop and may be cached", async () => {
        state.cookies.set("ref", "Fake Watches");
        expect(await found("daytona")).toEqual(["public-1"]);
        expect((await search("daytona")).headers.get("cache-control")).toContain("s-maxage");
    });

    it("on the demo shows the visitor's preview pieces and is never shared through a cache", async () => {
        state.demo = true;
        state.cookies.set("ref", "Fake Watches");
        expect(await found("daytona")).toEqual(["preview-1"]);
        expect((await search("daytona")).headers.get("cache-control")).toContain("no-store");
    });
});

describe("brand pages", () => {
    const brand_slugs = async () => (await get_brand("rolex")).map((i) => i.slug).sort();

    it("hide deleted and preview-only pieces", async () => {
        expect(await brand_slugs()).toEqual(["public-1"]);
    });

    it("ignore a ref cookie on a dealer's shop", async () => {
        state.cookies.set("ref", "Fake Watches");
        expect(await brand_slugs()).toEqual(["public-1"]);
    });

    it("show the visitor's preview pieces on the demo", async () => {
        state.demo = true;
        state.cookies.set("ref", "Fake Watches");
        expect(await brand_slugs()).toEqual(["preview-1", "public-1"]);
    });
});
