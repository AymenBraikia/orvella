import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection } from "mongodb";
import type { Item } from "@/types/item";

/*
 * Runs the real stock code against a throwaway in-memory MongoDB. The collections module is
 * replaced so the tests can never reach the database in .env.
 */

let server: MongoMemoryServer;
let client: MongoClient;
let items: Collection<Item>;

vi.mock("next/cache", () => ({ revalidateTag: () => {}, revalidatePath: () => {} }));
vi.mock("../app/db/collections", () => ({ items_collection: async () => items }));

const { reserve_items, release_reservation, release_expired_reservations, holds_reservation, mark_items_sold, admin_set_status } = await import("@/app/server/inventory");

const minutes = (n: number) => new Date(Date.now() + n * 60_000);

async function item(slug: string) {
    return (await items.findOne({ slug }))!;
}

async function seed(slug: string, quantity: number) {
    await items.insertOne({ slug, name: slug, price: 1000, quantity, reservations: [], inStock: quantity > 0, status: quantity > 0 ? "available" : "sold" } as unknown as Item);
}

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    items = client.db("orvella_test").collection<Item>("items");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    await items.deleteMany({});
});

describe("reservation and sold flow", () => {
    it("reserving a one-of-one piece hides it, paying marks it sold", async () => {
        await seed("rolex-1", 1);

        expect(await reserve_items("order-a", [{ slug: "rolex-1", quantity: 1 }], minutes(15))).toEqual([]);
        let doc = await item("rolex-1");
        expect(doc.quantity).toBe(0);
        expect(doc.status).toBe("reserved");
        expect(doc.inStock).toBe(false);
        expect(await holds_reservation("order-a", [{ slug: "rolex-1", quantity: 1 }])).toBe(true);

        expect(await mark_items_sold("order-a", [{ slug: "rolex-1", quantity: 1 }])).toEqual([]);
        doc = await item("rolex-1");
        expect(doc.status).toBe("sold");
        expect(doc.reservations).toEqual([]);
        expect(doc.quantity).toBe(0);
    });

    it("a cancelled order puts the piece back on sale (and releasing twice is harmless)", async () => {
        await seed("omega-1", 1);
        await reserve_items("order-a", [{ slug: "omega-1", quantity: 1 }], minutes(15));

        await release_reservation("order-a", ["omega-1"]);
        await release_reservation("order-a", ["omega-1"]);

        const doc = await item("omega-1");
        expect(doc.quantity).toBe(1);
        expect(doc.status).toBe("available");
        expect(doc.inStock).toBe(true);
    });

    it("an expired hold returns to stock and reports its order", async () => {
        await seed("cartier-1", 1);
        await reserve_items("order-late", [{ slug: "cartier-1", quantity: 1 }], minutes(-1));

        expect(await release_expired_reservations()).toEqual(["order-late"]);
        expect((await item("cartier-1")).status).toBe("available");
        expect(await holds_reservation("order-late", [{ slug: "cartier-1", quantity: 1 }])).toBe(false);
    });

    it("a multi-item order reserves everything or nothing", async () => {
        await seed("ring-1", 1);
        await seed("ring-2", 0);

        expect(await reserve_items("order-a", [{ slug: "ring-1", quantity: 1 }, { slug: "ring-2", quantity: 1 }], minutes(15))).toEqual(["ring-2"]);
        expect((await item("ring-1")).status).toBe("available");
        expect((await item("ring-1")).quantity).toBe(1);
    });

    it("payment after the hold lapsed and someone else bought the piece is reported as a conflict", async () => {
        await seed("ap-1", 1);
        await reserve_items("order-slow", [{ slug: "ap-1", quantity: 1 }], minutes(-1));

        // A second buyer checks out: the lapsed hold is released first, then they get the piece.
        expect(await reserve_items("order-fast", [{ slug: "ap-1", quantity: 1 }], minutes(15))).toEqual([]);
        expect(await mark_items_sold("order-fast", [{ slug: "ap-1", quantity: 1 }])).toEqual([]);

        expect(await mark_items_sold("order-slow", [{ slug: "ap-1", quantity: 1 }])).toEqual(["ap-1"]);
        expect((await item("ap-1")).quantity).toBe(0);
    });

    it("stock never goes negative for items with several units", async () => {
        await seed("strap", 3);

        expect(await reserve_items("a", [{ slug: "strap", quantity: 2 }], minutes(15))).toEqual([]);
        expect(await reserve_items("b", [{ slug: "strap", quantity: 2 }], minutes(15))).toEqual(["strap"]);
        expect(await reserve_items("c", [{ slug: "strap", quantity: 1 }], minutes(15))).toEqual([]);

        const doc = await item("strap");
        expect(doc.quantity).toBe(0);
        expect(doc.status).toBe("reserved");
    });

    it("the dealer can hold a piece by hand and put it back on sale", async () => {
        await seed("patek-1", 1);

        await admin_set_status("patek-1", "reserved", true);
        expect(await reserve_items("order-a", [{ slug: "patek-1", quantity: 1 }], minutes(15))).toEqual(["patek-1"]);

        await admin_set_status("patek-1", "available", true);
        expect(await reserve_items("order-a", [{ slug: "patek-1", quantity: 1 }], minutes(15))).toEqual([]);
    });
});

describe("double purchase", () => {
    it("two simultaneous checkouts for the same one-of-one piece: exactly one wins", async () => {
        await seed("daytona-1", 1);

        const attempts = await Promise.all(Array.from({ length: 10 }, (_, i) => reserve_items(`order-${i}`, [{ slug: "daytona-1", quantity: 1 }], minutes(15))));

        const winners = attempts.filter((failed) => failed.length === 0);
        expect(winners).toHaveLength(1);

        const doc = await item("daytona-1");
        expect(doc.quantity).toBe(0);
        expect(doc.reservations).toHaveLength(1);
    });

    it("two payments for the same piece: only the order holding it is fulfilled", async () => {
        await seed("nautilus-1", 1);

        const [first, second] = await Promise.all([
            reserve_items("order-1", [{ slug: "nautilus-1", quantity: 1 }], minutes(15)),
            reserve_items("order-2", [{ slug: "nautilus-1", quantity: 1 }], minutes(15)),
        ]);
        const [winner, loser] = first.length === 0 ? ["order-1", "order-2"] : ["order-2", "order-1"];
        expect([first, second].filter((f) => f.length === 0)).toHaveLength(1);

        const [win, lose] = await Promise.all([mark_items_sold(winner, [{ slug: "nautilus-1", quantity: 1 }]), mark_items_sold(loser, [{ slug: "nautilus-1", quantity: 1 }])]);
        expect(win).toEqual([]);
        expect(lose).toEqual(["nautilus-1"]);
        expect((await item("nautilus-1")).status).toBe("sold");
    });
});
