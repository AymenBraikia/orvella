import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection } from "mongodb";
import type { Item } from "@/types/item";
import type { Order } from "@/types/order";

/*
 * The real webhook, order and stock code against a throwaway MongoDB. Only PayPal's API (fetch) and
 * the customer-facing side effects are replaced.
 */

let server: MongoMemoryServer;
let client: MongoClient;
let items: Collection<Item>;
let orders: Collection<Order>;

const notify_order_paid = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("next/cache", () => ({ unstable_cache: <T,>(fn: T) => fn, revalidateTag: () => {}, revalidatePath: () => {} }));
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: (fn: () => unknown) => fn() }));
vi.mock("node:timers/promises", () => ({ setTimeout: async () => {} }));
vi.mock("../app/db/collections", () => ({ items_collection: async () => items, orders_collection: async () => orders }));
vi.mock("../app/server/cart", () => ({ remove_from_cart: async () => {} }));
vi.mock("../app/server/email/notifications", () => ({ notify_order_paid, notify_order_cancelled: async () => {} }));
vi.mock("../app/server/place_order", () => ({ thank_you_path: () => "/thank_you", owns_order: async () => true }));
vi.mock("../app/server/checkout", () => ({ ONLINE_RESERVATION_MINUTES: 15 }));
vi.mock("../app/server/increase_relevance_score", () => ({ default: () => {} }));

const { POST } = await import("@/app/api/paypal/webhook/route");
const { capture_paypal_order } = await import("@/app/paypal/capture");
const { reserve_items } = await import("@/app/server/inventory");

const ORDER_ID = "ORV-2026-000001";
const SLUG = "rolex-1";

/** What PayPal's API answers to a capture; each test sets it. */
let capture_response: { status: number; body: unknown } | "timeout";
let capture_calls: number;

function paypal_api(url: string, init?: RequestInit) {
    if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "token" });
    if (url.endsWith("/v1/notifications/verify-webhook-signature")) {
        const { transmission_sig, webhook_id } = JSON.parse(String(init?.body));
        return Response.json({ verification_status: transmission_sig == "real" && webhook_id == "WH-1" ? "SUCCESS" : "FAILURE" });
    }
    if (url.endsWith("/capture")) {
        capture_calls++;
        if (capture_response == "timeout") throw new Error("timeout");
        return Response.json(capture_response.body, { status: capture_response.status });
    }
    throw new Error(`Unexpected PayPal call: ${url}`);
}

function webhook(event: object, signature = "real") {
    const headers = { "paypal-auth-algo": "SHA256withRSA", "paypal-cert-url": "https://api.paypal.com/cert", "paypal-transmission-id": "t-1", "paypal-transmission-sig": signature, "paypal-transmission-time": "2026-10-31T10:00:00Z" };
    return POST(new Request("https://shop.test/api/paypal/webhook", { method: "POST", headers, body: JSON.stringify(event) }));
}

const completed = (value = "24900.00", id = "evt-completed") => ({ id, event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAP-1", status: "COMPLETED", custom_id: ORDER_ID, amount: { currency_code: "EUR", value } } });
const refunded = (value: string, id = "evt-refund") => ({ id, event_type: "PAYMENT.CAPTURE.REFUNDED", resource: { id: "REF-1", amount: { currency_code: "EUR", value }, links: [{ rel: "up", href: "https://api.paypal.com/v2/payments/captures/CAP-1" }] } });
const captured = (status = "COMPLETED", value = "24900.00") => ({ status: 201, body: { id: "PP-1", status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: "CAP-1", status, amount: { currency_code: "EUR", value } }] } }] } });

const order = async () => (await orders.findOne({ id: ORDER_ID }))!;
const item = async () => (await items.findOne({ slug: SLUG }))!;

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    items = client.db("orvella_test").collection<Item>("items");
    orders = client.db("orvella_test").collection<Order>("orders");
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

beforeEach(async () => {
    await items.deleteMany({});
    await orders.deleteMany({});
    capture_calls = 0;
    capture_response = captured();
    notify_order_paid.mockClear();

    vi.stubEnv("PAYPAL_WEBHOOK_ID", "WH-1");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => paypal_api(url, init)));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    await items.insertOne({ slug: SLUG, price: 24900, quantity: 1, reservations: [], inStock: true, status: "available", type: "watch" } as unknown as Item);
    await reserve_items(ORDER_ID, [{ slug: SLUG, quantity: 1 }], new Date(Date.now() + 15 * 60_000));
    await orders.insertOne({
        id: ORDER_ID,
        paypal_order_id: "PP-1",
        email: "anna@example.com",
        items: [{ slug: SLUG, quantity: 1 }],
        currency: "EUR",
        totals: { total: 24900 },
        payment_method: "PayPal",
        status: "pending_payment",
        status_history: [],
    } as unknown as Order);
});

describe("PayPal webhook", () => {
    it("rejects a forged event and changes nothing", async () => {
        const response = await webhook(completed(), "forged");
        expect(response.status).toBe(400);
        expect((await order()).status).toBe("pending_payment");
    });

    it("rejects everything while PAYPAL_WEBHOOK_ID is missing", async () => {
        vi.stubEnv("PAYPAL_WEBHOOK_ID", "");
        expect((await webhook(completed())).status).toBe(400);
        expect((await order()).status).toBe("pending_payment");
    });

    it("rejects a body that is not JSON, before asking PayPal", async () => {
        const response = await POST(new Request("https://shop.test/api/paypal/webhook", { method: "POST", body: `{},"webhook_id":"attacker"` }));
        expect(response.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("a completed capture marks the order paid and the piece sold", async () => {
        expect((await webhook(completed())).status).toBe(200);

        const paid = await order();
        expect(paid.status).toBe("paid");
        expect(paid.paypal_capture_id).toBe("CAP-1");
        expect((await item()).status).toBe("sold");
        expect(notify_order_paid).toHaveBeenCalledOnce();
    });

    it("a replayed completed capture is a no-op", async () => {
        await webhook(completed());
        const history = (await order()).status_history.length;

        await webhook(completed());

        expect((await order()).status_history).toHaveLength(history);
        expect(notify_order_paid).toHaveBeenCalledOnce();
    });

    it("a wrong amount or currency does not mark the order paid, and the dealer is told", async () => {
        await webhook(completed("1.00"));
        await webhook({ ...completed(), resource: { ...completed().resource, amount: { currency_code: "USD", value: "24900.00" } } });

        const open = await order();
        expect(open.status).toBe("pending_payment");
        expect(open.admin_notes).toContain("Amount mismatch: captured 1.00 EUR");
        expect((await item()).status).toBe("reserved");
    });

    it("money arriving after the hold lapsed and the order was cancelled still counts", async () => {
        await orders.updateOne({ id: ORDER_ID }, { $set: { status: "cancelled" } });
        await webhook(completed());
        expect((await order()).status).toBe("paid");
    });

    it("the browser closed after approval: the webhook captures and the order ends up paid", async () => {
        await webhook({ id: "evt-approved", event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "PP-1", status: "APPROVED" } });

        expect(capture_calls).toBe(1);
        expect((await order()).status).toBe("paid");
        expect((await item()).status).toBe("sold");
    });

    it("no second capture when the browser already finished", async () => {
        await webhook(completed());
        await webhook({ id: "evt-approved", event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "PP-1", status: "APPROVED" } });
        expect(capture_calls).toBe(0);
    });

    it("a denied capture leaves a history entry and an admin note, once, and frees the piece", async () => {
        const denied = { id: "evt-denied", event_type: "PAYMENT.CAPTURE.DENIED", resource: { id: "CAP-1", custom_id: ORDER_ID, amount: { currency_code: "EUR", value: "24900.00" } } };
        await webhook(denied);
        await webhook(denied);

        const open = await order();
        expect(open.status_history.filter((e) => e.note?.includes("denied"))).toHaveLength(1);
        expect(open.admin_notes).toBe("PayPal capture denied (24900.00 EUR)");
        expect(open.status).toBe("cancelled");
        expect((await item()).status).toBe("available");
    });

    it("a denied event cannot cancel an order that was already paid", async () => {
        await webhook(completed());
        await webhook({ id: "evt-denied", event_type: "PAYMENT.CAPTURE.DENIED", resource: { id: "CAP-1", custom_id: ORDER_ID } });
        expect((await order()).status).toBe("paid");
    });

    it("a replayed wrong amount does not repeat the note", async () => {
        await webhook(completed("1.00"));
        await webhook(completed("1.00"));
        expect((await order()).admin_notes).toBe("Amount mismatch: captured 1.00 EUR");
    });

    it("keeps the dealer's own notes when adding one", async () => {
        await orders.updateOne({ id: ORDER_ID }, { $set: { admin_notes: "Customer called" } });
        await webhook({ id: "evt-reversed", event_type: "PAYMENT.CAPTURE.REVERSED", resource: { id: "CAP-1", custom_id: ORDER_ID, amount: { currency_code: "EUR", value: "24900.00" } } });
        expect((await order()).admin_notes).toBe("Customer called\nPayPal payment reversed (24900.00 EUR)");
    });

    it("a full refund, found through the capture link, moves a paid order to refunded", async () => {
        await webhook(completed());
        await webhook(refunded("24900.00"));
        expect((await order()).status).toBe("refunded");
    });

    it("a partial refund only leaves a note", async () => {
        await webhook(completed());
        await webhook(refunded("100.00"));

        const paid = await order();
        expect(paid.status).toBe("paid");
        expect(paid.admin_notes).toContain("partial refund (100.00 EUR)");
    });
});

describe("capturing a PayPal order", () => {
    const capture = async () => capture_paypal_order(await order());

    it("a declined capture inside a COMPLETED order is not paid", async () => {
        capture_response = captured("DECLINED");

        expect(await capture()).toEqual({ error: "declined" });
        expect((await order()).status).toBe("cancelled");
        expect((await item()).status).toBe("available");
    });

    it("a pending capture keeps the order open, and the webhook finishes it later", async () => {
        capture_response = captured("PENDING");

        expect(await capture()).toEqual({ error: "pending" });
        expect((await order()).status).toBe("pending_payment");

        await webhook(completed());
        expect((await order()).status).toBe("paid");
    });

    it("no answer from PayPal keeps the order and its hold: the money may have been taken", async () => {
        capture_response = "timeout";

        expect(await capture()).toEqual({ error: "pending" });
        expect((await order()).status).toBe("pending_payment");
        expect((await item()).status).toBe("reserved");
    });

    it("a capture already running elsewhere does not cancel the order", async () => {
        capture_response = { status: 409, body: { name: "CONFLICT" } };
        expect(await capture()).toEqual({ error: "pending" });
        expect((await order()).status).toBe("pending_payment");
    });

    it("PayPal's final no cancels the order and frees the piece", async () => {
        capture_response = { status: 422, body: { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "INSTRUMENT_DECLINED" }] } };

        expect(await capture()).toEqual({ error: "declined" });
        expect((await order()).status).toBe("cancelled");
        expect((await item()).status).toBe("available");
    });

    it("an order PayPal says is already captured is not cancelled", async () => {
        capture_response = { status: 422, body: { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] } };
        expect(await capture()).toEqual({ error: "pending" });
        expect((await order()).status).toBe("pending_payment");
    });
});
