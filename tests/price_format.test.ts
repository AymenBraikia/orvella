import { beforeEach, describe, expect, it } from "vitest";
import { eur_value_in_currency, set_rates } from "@/currency";
import { country_to_currency, format_money, format_price } from "@/app/(site)/lib/price_format";

beforeEach(() => {
    eur_value_in_currency.clear();
    set_rates({ USD: 1.08, JPY: 162.31 });
});

describe("catalogue prices", () => {
    it("whole amounts show no decimals", () => {
        expect(format_price(24900, "EUR")).toBe("€24,900");
        expect(format_price(5000, "USD")).toBe("$5,400");
        expect(format_price(1000, "JPY")).toBe("¥162,310");
    });

    it("amounts with cents keep them", () => {
        expect(format_price(49.99, "EUR")).toBe("€49.99");
    });

    it("without an exchange rate the real EUR price is shown", () => {
        eur_value_in_currency.clear();
        expect(format_price(24900, "USD")).toBe("€24,900");
    });
});

describe("currency by country", () => {
    it("Switzerland gets CHF", () => {
        expect(country_to_currency.get("CH")).toBe("CHF");
    });

    it("European countries without the euro get EUR, not the USD fallback", () => {
        for (const country of ["SE", "DK", "NO", "PL", "CZ", "HU", "RO", "IS", "LI"] as const) expect(country_to_currency.get(country)).toBe("EUR");
    });
});

describe("order amounts", () => {
    it("stay exact, whole or not", () => {
        expect(format_money(24900, "EUR")).toBe("€24,900.00");
        expect(format_money(1234.5, "EUR")).toBe("€1,234.50");
        expect(format_money(1000, "JPY")).toBe("¥1,000");
    });
});
