import { describe, expect, it } from "vitest";
import { compute_totals, convert_eur, minor_to_string, type TotalsInput } from "@/app/(site)/lib/order_totals";

/** What PayPal / Stripe receive: every part as a decimal string, and the parts must add up. */
function strings(input: TotalsInput) {
    const t = compute_totals(input);
    const s = (n: number) => minor_to_string(n, input.currency);
    return { t, items: s(t.items_minor), shipping: s(t.shipping_minor), tax: s(t.tax_minor), discount: s(t.discount_minor), total: s(t.total_minor) };
}

function assert_adds_up(t: ReturnType<typeof compute_totals>) {
    expect(t.items_minor + t.shipping_minor + t.tax_minor - t.discount_minor).toBe(t.total_minor);
    expect(t.line_minor.reduce((a, b) => a + b, 0)).toBe(t.items_minor);
}

describe("order totals", () => {
    it("EUR, VAT included: exact cents, shipping added, VAT shown but not added", () => {
        const { t, items, shipping, tax, total } = strings({
            lines: [
                { unit_price_eur: 12345.67, quantity: 1 },
                { unit_price_eur: 49.99, quantity: 3 },
            ],
            shipping_eur: 55,
            currency: "EUR",
            rate: 1,
            tax: { mode: "included", rate: 19 },
        });

        expect(items).toBe("12495.64");
        expect(shipping).toBe("55.00");
        expect(tax).toBe("0.00");
        expect(total).toBe("12550.64");
        // 12550.64 - 12550.64 / 1.19 = 2003.88
        expect(minor_to_string(t.tax_included_minor, "EUR")).toBe("2003.88");
        assert_adds_up(t);
    });

    it("USD, VAT added: prices and shipping converted with the same rate, VAT on items + shipping", () => {
        const { t, items, shipping, tax, total } = strings({
            lines: [{ unit_price_eur: 12345.67, quantity: 1 }],
            shipping_eur: 55,
            currency: "USD",
            rate: 1.0837,
            tax: { mode: "added", rate: 19 },
        });

        // Converted prices are whole units, like the storefront shows them.
        expect(items).toBe("13379.00");
        expect(shipping).toBe("60.00"); // 55 * 1.0837 = 59.6 -> 60 (used to be added unconverted)
        expect(tax).toBe("2553.41"); // 19 % of 13439.00
        expect(total).toBe("15992.41");
        assert_adds_up(t);
    });

    it("JPY is a zero-decimal currency: no decimals anywhere", () => {
        const { t, items, shipping, total } = strings({
            lines: [{ unit_price_eur: 8900, quantity: 1 }],
            shipping_eur: 95,
            currency: "JPY",
            rate: 162.31,
            tax: { mode: "included", rate: 19 },
        });

        expect(items).toBe("1444559");
        expect(shipping).toBe("15419");
        expect(total).toBe("1459978");
        expect(total).not.toContain(".");
        assert_adds_up(t);
    });

    it("margin scheme: no VAT added or shown", () => {
        const { t, tax, total } = strings({ lines: [{ unit_price_eur: 5000, quantity: 1 }], shipping_eur: 0, currency: "EUR", rate: 1, tax: { mode: "margin_scheme", rate: 19 } });
        expect(tax).toBe("0.00");
        expect(t.tax_included_minor).toBe(0);
        expect(total).toBe("5000.00");
    });

    it("discount never exceeds the items and still adds up", () => {
        const { t, discount, total } = strings({ lines: [{ unit_price_eur: 100, quantity: 1 }], shipping_eur: 10, discount_eur: 500, currency: "EUR", rate: 1, tax: { mode: "included", rate: 19 } });
        expect(discount).toBe("100.00");
        expect(total).toBe("10.00");
        assert_adds_up(t);
    });

    it("refuses to price a foreign currency without an exchange rate (instead of charging 1:1)", () => {
        expect(() => compute_totals({ lines: [{ unit_price_eur: 100, quantity: 1 }], shipping_eur: 0, currency: "USD", rate: 0, tax: { mode: "included", rate: 19 } })).toThrow();
    });

    it("display conversion matches the charged unit price", () => {
        const t = compute_totals({ lines: [{ unit_price_eur: 8590, quantity: 1 }], shipping_eur: 0, currency: "GBP", rate: 0.8571, tax: { mode: "included", rate: 19 } });
        expect(t.unit_minor[0] / 100).toBe(convert_eur(8590, "GBP", 0.8571));
    });
});
