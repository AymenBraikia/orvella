import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection, type Document } from "mongodb";
import { stock_rank } from "@/app/(site)/lib/stock";

let server: MongoMemoryServer;
let client: MongoClient;
let users: Collection<Document>;
let carts: Collection<Document>;

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("../app/[local]/(auth)/auth/jwt", () => ({ verifyJwt: () => null }));
vi.mock("../app/server/get_item", () => ({ default: async () => null }));
vi.mock("../app/db/collections", () => ({ users_collection: async () => users, carts_collection: async () => carts }));

const { rename_in_carts } = await import("@/app/server/cart");

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    users = client.db("orvella_test").collection("users");
    carts = client.db("orvella_test").collection("carts");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    await users.deleteMany({});
    await carts.deleteMany({});
});

describe("renaming a piece", () => {
    it("updates the slug in account carts and guest carts, and nothing else", async () => {
        const cart = [
            { slug: "old-slug", quantity: 1 },
            { slug: "other", quantity: 2 },
        ];
        await users.insertOne({ email: "anna@example.com", cart });
        await carts.insertOne({ cart });

        await rename_in_carts("old-slug", "new-slug");

        const expected = [
            { slug: "new-slug", quantity: 1 },
            { slug: "other", quantity: 2 },
        ];
        expect((await users.findOne())?.cart).toEqual(expected);
        expect((await carts.findOne())?.cart).toEqual(expected);
    });
});

describe("quiz results", () => {
    it("rank available pieces first, reserved next, sold last", () => {
        const items = [{ stock_status: "sold" }, { stock_status: "available" }, { stock_status: "reserved" }, {}] as const;
        const sorted = [...items].sort((a, b) => stock_rank(a) - stock_rank(b));
        expect(sorted.map((i) => "stock_status" in i && i.stock_status)).toEqual(["available", false, "reserved", "sold"]);
    });
});
