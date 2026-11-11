import { beforeEach, describe, expect, it, vi } from "vitest";
import { eur_value_in_currency, set_charge_mode, set_rates } from "@/currency";
import { format_cart_money, format_money, format_price } from "@/app/(site)/lib/price_format";
import { minor_to_string } from "@/app/(site)/lib/order_totals";

/*
 * The storefront may show any currency, but what gets charged follows the setting. The quote is the
 * real one: it goes through compute_totals exactly as the order that is placed does.
 */

const settings = vi.hoisted(() => ({
    charge_currency: "EUR" as "EUR" | "visitor",
    tax: { mode: "included" as const, rate: 19 },
    payments: { local_pickup: true },
}));

vi.mock("../app/server/settings", () => ({ get_settings: async () => settings }));
vi.mock("../app/server/update_currency_rates", () => ({ default: async () => ({}) }));
vi.mock("../app/server/inventory", () => ({
    read_items_fresh: async () => [{ slug: "rolex-1", type: "watch", brand: "rolex", model: "Daytona", price: 24900.5, quantity: 1, reservations: [], images: [] }],
}));

const { build_quote, checkout_currency } = await import("@/app/server/checkout");

const CUSTOMER = { local_pickup: true, address: {}, diff_address: { active: false } } as Parameters<typeof build_quote>[1];
const quote = async () => build_quote([{ slug: "rolex-1", quantity: 1 }], CUSTOMER, await checkout_currency("USD"));

beforeEach(() => {
    eur_value_in_currency.clear();
    set_rates({ USD: 1.1 });
    set_charge_mode("visitor");
    settings.charge_currency = "EUR";
});

describe('charge_currency: "EUR"', () => {
    it("a visitor browsing in USD is charged the exact EUR price", async () => {
        const q = await quote();
        expect(q.currency).toBe("EUR");
        expect(q.exchange_rate).toBe(1);
        expect(minor_to_string(q.minor.total_minor, q.currency)).toBe("24900.50");
    });

    it("works without exchange rates, since nothing is converted", async () => {
        eur_value_in_currency.clear();
        expect((await quote()).currency).toBe("EUR");
    });

    it("the storefront marks other currencies as an estimate, but not EUR or order amounts", () => {
        set_charge_mode("EUR");
        expect(format_price(1000, "USD")).toBe("≈ $1,100");
        expect(format_cart_money(1100, "USD")).toBe("≈ $1,100.00");
        expect(format_price(1000, "EUR")).toBe("€1,000");
        expect(format_money(1100, "USD")).toBe("$1,100.00");
    });

    it("a price with no exchange rate is the real EUR price, so it is no estimate", () => {
        set_charge_mode("EUR");
        eur_value_in_currency.clear();
        expect(format_price(1000, "USD")).toBe("€1,000");
    });
});

describe('charge_currency: "visitor"', () => {
    beforeEach(() => {
        settings.charge_currency = "visitor";
    });

    it("a visitor browsing in USD is charged in USD at the converted price", async () => {
        const q = await quote();
        expect(q.currency).toBe("USD");
        expect(q.exchange_rate).toBe(1.1);
        expect(minor_to_string(q.minor.total_minor, q.currency)).toBe("27391.00"); // 24900.5 * 1.1, rounded to whole dollars
    });

    it("prices are what will be charged, so nothing is marked", () => {
        expect(format_price(1000, "USD")).toBe("$1,100");
        expect(format_cart_money(1100, "USD")).toBe("$1,100.00");
    });
});
