import { readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection, type Document } from "mongodb";

/* Private per-lead demos: address rules, saving, their storefront products, photos, deleting and visits, against a throwaway MongoDB. */

let server: MongoMemoryServer;
let client: MongoClient;
let demos: Collection<Document>;
let photos: Collection<Document>;
let enquiries: Collection<Document>;
let items: Collection<Document>;

vi.mock("../app/db/collections", () => ({
    db: async () => client.db("orvella_test"),
    private_demos_collection: async () => demos,
    private_demo_photos_collection: async () => photos,
    enquiries_collection: async () => enquiries,
    items_collection: async () => items,
}));

const { RESERVED_SLUGS, demo_slug_of, slug_problem } = await import("@/app/(site)/lib/private_demo_slugs");
const { demo_schema, instagram_handle } = await import("@/app/(admin)/admin/demos/schema");
const lib = await import("@/app/server/private_demos");
const { piece_kind } = await import("@/types/private_demo");

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);

async function demo_input(demo_id: string, slug = "dn", name = "DN Watches") {
    const photo = await lib.save_demo_photo(demo_id, "image/jpeg", PNG);
    if (!photo.ok) throw new Error(photo.error);
    return {
        slug,
        name,
        instagram: "@dn.watches",
        category: "watches",
        language: "en",
        currency: "USD",
        pieces: [{ id: "piece001", brand: "Rolex", title: "Rolex Submariner 16610", price: 9500, description: "Full set, 2004.", photos: [photo.id] }],
    };
}

beforeAll(async () => {
    // Startup can take a while on a busy machine.
    server = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
    // Same strict Stable API as the app (app/db/client.ts), so unsupported commands fail here too.
    client = await MongoClient.connect(server.getUri(), { serverApi: { version: "1", strict: true } });
    const db = client.db("orvella_test");
    demos = db.collection("private_demos");
    photos = db.collection("private_demo_photos");
    enquiries = db.collection("enquiries");
    items = db.collection("items");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    await Promise.all([demos, photos, enquiries, items].map((c) => c.deleteMany({})));
});

describe("demo addresses", () => {
    it("reserves every route and public folder of the site", () => {
        const route_dirs = readdirSync("app/[local]").filter((g) => g.startsWith("("));
        const pages = route_dirs.flatMap((group) => readdirSync(`app/[local]/${group}`, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name));
        const top = readdirSync("app").filter((name) => !name.startsWith("["));
        const public_dirs = readdirSync("public", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
        const names = [...pages, ...top, ...public_dirs].filter((name) => !/^[[(_]/.test(name) && !/\.(tsx?|css|json)$/.test(name));

        expect(names.filter((name) => slug_problem(name) == null)).toEqual([]);
        for (const name of ["why", "admin", "api", "en", "fr", "shop", "store"]) expect(RESERVED_SLUGS.has(name)).toBe(true);
    });

    it("finds a demo only at a top-level address", () => {
        expect(demo_slug_of("/dn")).toBe("dn");
        expect(demo_slug_of("/dn/")).toBe("dn");
        for (const path of ["/", "/why", "/admin", "/en", "/fr/shop", "/api/x", "/DN", "/dn/piece", "/-dn"]) expect(demo_slug_of(path)).toBeNull();
    });

    it("rejects reserved and malformed addresses", () => {
        for (const slug of ["why", "admin", "api", "en", "x", "has space", "trailing-", "a".repeat(41)]) expect(slug_problem(slug), slug).not.toBeNull();
        expect(slug_problem("dn")).toBeNull();
    });

    it("accepts an Instagram handle in any common form", () => {
        expect(instagram_handle("@dn.watches")).toBe("dn.watches");
        expect(instagram_handle("https://www.instagram.com/dn.watches/?hl=en")).toBe("dn.watches");
        const parsed = demo_schema.shape.instagram.safeParse("");
        expect(parsed.success && parsed.data).toBe(undefined);
    });
});

describe("saving", () => {
    it("creates a live demo with no views", async () => {
        const id = randomUUID();
        expect(await lib.save_demo(id, await demo_input(id))).toEqual({ ok: true });
        expect(await lib.find_demo("dn")).toMatchObject({ id, slug: "dn", instagram: "dn.watches", enabled: true, views: 0, stale: true });
        expect(await lib.demo_by_ref("DN Watches")).toMatchObject({ id });
    });

    it("puts each piece in the store as a product only the demo's visitors see, with nothing made up", async () => {
        const id = randomUUID();
        await lib.save_demo(id, await demo_input(id));
        const item = await items.findOne({ slug: "dn-piece001" });
        expect(item).toMatchObject({
            type: "watch",
            preview: "DN Watches",
            private_demo: id,
            brand: "rolex",
            model: "Submariner 16610",
            display_name: "Rolex Submariner 16610",
            price: 9500,
            currency: "EUR",
            deleted: false,
            quantity: 1,
            status: "available",
            condition: "UNVERIFIED",
            movement: "UNVERIFIED",
            caseDiameterMm: 0,
            year: 0,
        });
        expect(item!.images).toEqual([expect.stringMatching(/^\/api\/demo-photos\/[0-9a-f-]{36}$/)]);
    });

    it("fills in the product details that are given and leaves the rest unknown", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        const details = { movement: "Automatic", caseMaterial: "Oystersteel", caseDiameterMm: 40, waterResistanceM: 300, condition: "Pre-Owned" };
        expect(await lib.save_demo(id, { ...input, pieces: [{ ...input.pieces[0], details }] })).toEqual({ ok: true });
        expect(await items.findOne({ slug: "dn-piece001" })).toMatchObject({ ...details, braceletMaterial: "UNVERIFIED", dialColor: "UNVERIFIED", reference: "", year: 0, gender: "UNVERIFIED" });

        const ring = { id: "ring1", kind: "ring", title: "Ring", price: 900, description: "A ring.", photos: input.pieces[0].photos, details: { metal_type: "Gold", karats: 18, stones: ["Diamond"], ring_size: "" } };
        await lib.save_demo(id, { ...input, category: "jewelry", pieces: [ring] });
        expect(await items.findOne({ slug: "dn-ring1" })).toMatchObject({ metal_type: "Gold", karats: 18, stones: ["Diamond"], ring_size: "", weight: 0 });
        expect(await lib.save_demo(id, { ...input, pieces: [{ ...input.pieces[0], details: { caseDiameterMm: Number.NaN } }] })).toMatchObject({ ok: false, fields: { "pieces.0.details.caseDiameterMm": expect.any(String) } });
    });

    it("removes the product of a piece taken out of the demo", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        const ring = { id: "ring1", kind: "ring", title: "Ring", price: 900, description: "A ring.", photos: input.pieces[0].photos };
        await lib.save_demo(id, { ...input, category: "mixed", pieces: [{ ...input.pieces[0], kind: "watch" }, ring] });
        expect(await items.countDocuments({ private_demo: id })).toBe(2);
        expect(await items.findOne({ slug: "dn-ring1" })).toMatchObject({ type: "ring", ring_size: "", metal_type: "" });

        await lib.save_demo(id, { ...input, category: "mixed", pieces: [ring] });
        expect((await items.find({ private_demo: id }).toArray()).map((i) => i.slug)).toEqual(["dn-ring1"]);
    });

    it("needs a store category on every piece of a jewelry or mixed demo", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        expect(await lib.save_demo(id, { ...input, category: "mixed" })).toMatchObject({ ok: false, fields: { "pieces.0.kind": expect.any(String) } });
        expect(await lib.save_demo(id, { ...input, category: "jewelry", pieces: [{ ...input.pieces[0], kind: "watch" }] })).toMatchObject({ ok: false });
        expect(piece_kind("watches", {})).toBe("watch");
        expect(piece_kind("jewelry", { kind: "watch" })).toBe("ring");
    });

    it("needs a price for every piece", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        expect(await lib.save_demo(id, { ...input, pieces: [{ ...input.pieces[0], price: undefined }] })).toMatchObject({ ok: false, fields: { "pieces.0.price": expect.any(String) } });
    });

    it("keeps names unique and usable as the store name", async () => {
        const a = randomUUID();
        const b = randomUUID();
        await lib.save_demo(a, await demo_input(a));
        expect(await lib.save_demo(b, await demo_input(b, "other", "dn watches"))).toMatchObject({ ok: false, fields: { name: expect.stringContaining("already") } });
        expect(await lib.save_demo(b, await demo_input(b, "other", "DN/Watches"))).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    });

    it("rejects an address another demo already uses, and reserved addresses", async () => {
        const a = randomUUID();
        const b = randomUUID();
        await lib.save_demo(a, await demo_input(a));
        expect(await lib.save_demo(b, await demo_input(b, "dn", "Other"))).toMatchObject({ ok: false, fields: { slug: expect.stringContaining("already") } });
        expect(await lib.save_demo(b, await demo_input(b, "why", "Other"))).toMatchObject({ ok: false, fields: { slug: expect.any(String) } });
    });

    it("never takes over a store product's address", async () => {
        await items.insertOne({ slug: "dn-piece001", type: "watch" });
        const id = randomUUID();
        expect(await lib.save_demo(id, await demo_input(id))).toMatchObject({ ok: false, fields: { slug: expect.stringContaining("dn-piece001") } });
        expect(await items.countDocuments({ slug: "dn-piece001" })).toBe(1);
    });

    it("never lets a demo show another demo's photos", async () => {
        const a = randomUUID();
        const b = randomUUID();
        const input_a = await demo_input(a);
        await lib.save_demo(a, input_a);
        expect(await lib.save_demo(b, { ...(await demo_input(b, "other", "Other")), pieces: input_a.pieces })).toMatchObject({ ok: false });
    });

    it("removes photos taken out of the demo when it is saved", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        const extra = await lib.save_demo_photo(id, "image/jpeg", PNG);
        await lib.save_demo(id, input);
        expect(extra.ok && (await photos.countDocuments({ _id: extra.id as never }))).toBe(0);
    });
});

describe("disabling and deleting", () => {
    it("hides a disabled demo, its products and its photos, and brings them back", async () => {
        const id = randomUUID();
        const input = await demo_input(id);
        await lib.save_demo(id, input);
        await lib.set_demo_enabled(id, false);
        expect(await lib.find_demo("dn")).toBeNull();
        expect(await lib.demo_by_ref("DN Watches")).toBeNull();
        expect(await items.findOne({ slug: "dn-piece001" })).toMatchObject({ deleted: true });
        expect((await lib.read_demo_photo(input.pieces[0].photos[0]))?.live).toBe(false);

        // Saving a disabled demo keeps its products hidden.
        await lib.save_demo(id, input);
        expect(await items.findOne({ slug: "dn-piece001" })).toMatchObject({ deleted: true });

        await lib.set_demo_enabled(id, true);
        expect(await items.findOne({ slug: "dn-piece001" })).toMatchObject({ deleted: false });
    });

    it("deletes the demo with its products, photos and enquiries, and nothing else", async () => {
        const a = randomUUID();
        const b = randomUUID();
        await lib.save_demo(a, await demo_input(a));
        await lib.save_demo(b, await demo_input(b, "other", "Other"));
        await enquiries.insertMany([{ demo: { id: a } }, { demo: { id: b } }, { item: { slug: "shop-piece" } }]);
        await items.insertOne({ slug: "shop-piece", type: "ring" });

        expect(await lib.delete_demo(a)).toEqual({ deleted: true, slugs: ["dn-piece001"] });
        expect(await demos.countDocuments()).toBe(1);
        expect(await items.countDocuments({ private_demo: a })).toBe(0);
        expect(await items.countDocuments()).toBe(2);
        expect(await photos.countDocuments({ demo_id: a })).toBe(0);
        expect(await photos.countDocuments({ demo_id: b })).toBe(1);
        expect(await enquiries.countDocuments()).toBe(2);
    });
});

describe("visits", () => {
    const h = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });
    const IPHONE_INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0";

    it("counts people, including Instagram's in-app browser", () => {
        expect(lib.is_counted_visit(h({ "user-agent": IPHONE_INSTAGRAM, "sec-fetch-dest": "document" }), false)).toBe(true);
        expect(lib.is_counted_visit(h({ "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36" }), false)).toBe(true);
    });

    it("ignores the admin, link previews and prefetches", () => {
        expect(lib.is_counted_visit(h({ "user-agent": IPHONE_INSTAGRAM }), true)).toBe(false);
        for (const agent of ["facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "WhatsApp/2.23", "Twitterbot/1.0", "TelegramBot (like TwitterBot)", "Googlebot/2.1", "meta-externalagent/1.1", ""]) {
            expect(lib.is_counted_visit(h({ "user-agent": agent }), false), agent).toBe(false);
            expect(lib.is_person(h({ "user-agent": agent })), agent).toBe(false);
        }
        expect(lib.is_counted_visit(h({ "user-agent": IPHONE_INSTAGRAM, "next-router-prefetch": "1" }), false)).toBe(false);
        expect(lib.is_counted_visit(h({ "user-agent": IPHONE_INSTAGRAM, "sec-purpose": "prefetch;prerender" }), false)).toBe(false);
    });

    it("keeps the first opening time and counts every visit", async () => {
        const id = randomUUID();
        await lib.save_demo(id, await demo_input(id));
        await lib.record_demo_view(id);
        const first = (await demos.findOne({ id }))!.first_opened_at;
        await new Promise((r) => setTimeout(r, 5));
        await lib.record_demo_view(id);
        const doc = (await demos.findOne({ id }))!;
        expect(doc.views).toBe(2);
        expect(doc.first_opened_at).toEqual(first);
        expect(doc.last_opened_at.getTime()).toBeGreaterThan(first.getTime());
    });

    it("clears the stale mark once the store has been refreshed", async () => {
        const id = randomUUID();
        await lib.save_demo(id, await demo_input(id));
        expect(await lib.demo_item_slugs(id)).toEqual(["dn-piece001"]);
        await lib.mark_demo_fresh(id);
        expect((await lib.find_demo("dn"))?.stale).toBeUndefined();
    });
});
