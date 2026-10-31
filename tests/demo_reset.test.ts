import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection, type Document } from "mongodb";
import { NextRequest } from "next/server";

/* The real reset, order and stock code against a throwaway MongoDB. */

let server: MongoMemoryServer;
let client: MongoClient;
let items: Collection<Document>;
let orders: Collection<Document>;
let enquiries: Collection<Document>;
let sell: Collection<Document>;
let consignments: Collection<Document>;
let appointments: Collection<Document>;

const state = vi.hoisted(() => ({ demo: true, flag: true }));

vi.mock("@/app/(site)/lib/demo", () => ({
    get DEMO_MODE() {
        return state.demo;
    },
}));
vi.mock("next/cache", () => ({ revalidateTag: () => {}, revalidatePath: () => {} }));
vi.mock("../app/server/settings", () => ({ get_settings: async () => ({ demo_reset: state.flag }) }));
vi.mock("../app/server/cart", () => ({ remove_from_cart: async () => {} }));
vi.mock("../app/server/email/notifications", () => ({ notify_order_cancelled: async () => {} }));
vi.mock("../app/db/collections", () => ({
    items_collection: async () => items,
    orders_collection: async () => orders,
    enquiries_collection: async () => enquiries,
    sell_collection: async () => sell,
    consignments_collection: async () => consignments,
    appointments_collection: async () => appointments,
}));

const { GET } = await import("@/app/api/cron/demo-reset/route");
const { reserve_items } = await import("@/app/server/inventory");

const hours_ago = (n: number) => new Date(Date.now() - n * 60 * 60_000);
const call = (secret = "cron-secret") => GET(new NextRequest("https://demo.test/api/cron/demo-reset", { headers: { authorization: `Bearer ${secret}` } }));
const item = async (slug: string) => (await items.findOne({ slug }))!;

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    const db = client.db("orvella_test");
    items = db.collection("items");
    orders = db.collection("orders");
    enquiries = db.collection("enquiries");
    sell = db.collection("sell");
    consignments = db.collection("consignment");
    appointments = db.collection("appointment");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    state.demo = true;
    state.flag = true;
    vi.stubEnv("CRON_SECRET", "cron-secret");

    await Promise.all([items, orders, enquiries, sell, consignments, appointments].map((c) => c.deleteMany({})));

    const piece = (slug: string, type: string, quantity: number, extra = {}) => ({ slug, type, quantity, reservations: [], inStock: quantity > 0, status: quantity > 0 ? "available" : "sold", ...extra });
    await items.insertMany([piece("sold-watch", "watch", 0, { sold_at: new Date() }), piece("held-watch", "watch", 1), piece("spare", "spare", 3), piece("removed", "watch", 0, { deleted: true })]);
    await reserve_items("ORV-OLD", [{ slug: "held-watch", quantity: 1 }], new Date(Date.now() + 3 * 24 * 60 * 60_000));
    await reserve_items("ORV-NEW", [{ slug: "spare", quantity: 2 }], new Date(Date.now() + 60 * 60_000));

    const order = (id: string, status: string, age: number, slug: string, quantity: number) => ({ id, status, created_at: hours_ago(age), status_history: [], items: [{ slug, quantity }] });
    await orders.insertMany([order("ORV-OLD", "pending_payment", 30, "held-watch", 1), order("ORV-NEW", "pending_payment", 2, "spare", 2), order("ORV-PAID", "paid", 2, "sold-watch", 1)]);

    for (const collection of [enquiries, sell, consignments, appointments]) await collection.insertMany([{ created_at: hours_ago(25) }, { created_at: hours_ago(23) }]);
});

async function expect_nothing_changed() {
    expect((await item("sold-watch")).status).toBe("sold");
    expect((await item("held-watch")).status).toBe("reserved");
    expect(await orders.countDocuments()).toBe(3);
    expect(await enquiries.countDocuments()).toBe(2);
}

describe("nightly demo reset", () => {
    it("does nothing when DEMO_MODE is off, even with the setting on", async () => {
        state.demo = false;
        expect(await (await call()).json()).toEqual({ skipped: true });
        await expect_nothing_changed();
    });

    it("does nothing while the setting is off", async () => {
        state.flag = false;
        expect(await (await call()).json()).toEqual({ skipped: true });
        await expect_nothing_changed();
    });

    it("refuses a wrong or missing cron secret", async () => {
        expect((await call("wrong")).status).toBe(401);
        vi.stubEnv("CRON_SECRET", "");
        expect((await call("")).status).toBe(401);
        await expect_nothing_changed();
    });

    it("puts every piece back on sale and drops all holds", async () => {
        expect((await call()).status).toBe(200);

        for (const slug of ["sold-watch", "held-watch"]) {
            const doc = await item(slug);
            expect(doc.status).toBe("available");
            expect(doc.quantity).toBe(1);
            expect(doc.inStock).toBe(true);
            expect(doc.reservations).toEqual([]);
            expect(doc.sold_at).toBeUndefined();
        }
    });

    it("keeps the stock of spare parts instead of forcing it to one", async () => {
        await call();
        expect((await item("spare")).quantity).toBe(3);
    });

    it("leaves deleted pieces alone", async () => {
        await call();
        const doc = await item("removed");
        expect(doc.quantity).toBe(0);
        expect(doc.status).toBe("sold");
    });

    it("deletes what is older than 24 hours and cancels the open orders it keeps", async () => {
        expect(await (await call()).json()).toEqual({ cancelled: 2, deleted: 5 });

        expect((await orders.find().toArray()).map((o) => [o.id, o.status]).sort()).toEqual([
            ["ORV-NEW", "cancelled"],
            ["ORV-PAID", "paid"],
        ]);
        for (const collection of [enquiries, sell, consignments, appointments]) expect(await collection.countDocuments()).toBe(1);
    });

    it("running it twice changes nothing more", async () => {
        await call();
        expect(await (await call()).json()).toEqual({ cancelled: 0, deleted: 0 });
    });
});
