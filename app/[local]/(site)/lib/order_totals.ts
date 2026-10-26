import type { TaxMode } from "@/types/order";

/*
 * The one place where order money is calculated. Both checkout flows (PayPal, bank transfer)
 * and the order summaries call compute_totals, so they cannot disagree.
 *
 * Everything is done in integer minor units (cents; yen for zero-decimal currencies), which makes
 * items + shipping + tax - discount === total exact — PayPal rejects any mismatch.
 */

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "HUF", "TWD", "KRW", "UGX", "VND"]);

export const BASE_CURRENCY = "EUR";

export type TaxConfig = { mode: TaxMode; rate: number };

export function currency_decimals(currency: string): number {
    return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

/**
 * EUR prices are kept to the cent. Converted prices are rounded to whole units of the target
 * currency (e.g. $12,345 rather than $12,345.67) — the storefront displays them the same way.
 */
export function convert_eur(eur: number, currency: string, rate: number): number {
    if (currency === BASE_CURRENCY) return Math.round(eur * 100) / 100;
    return Math.round(eur * rate);
}

export function to_minor(amount: number, currency: string): number {
    return Math.round(amount * 10 ** currency_decimals(currency));
}

export function from_minor(minor: number, currency: string): number {
    return minor / 10 ** currency_decimals(currency);
}

/** "1234.50" / "1234" — the exact decimal string payment providers expect. */
export function minor_to_string(minor: number, currency: string): string {
    const decimals = currency_decimals(currency);
    if (!decimals) return String(minor);

    const sign = minor < 0 ? "-" : "";
    const abs = Math.abs(minor);
    const unit = 10 ** decimals;
    return `${sign}${Math.floor(abs / unit)}.${String(abs % unit).padStart(decimals, "0")}`;
}

export type TotalsInput = {
    lines: { unit_price_eur: number; quantity: number }[];
    shipping_eur: number;
    discount_eur?: number;
    currency: string;
    /** 1 EUR = rate units of `currency`. Ignored for EUR. */
    rate: number;
    tax: TaxConfig;
};

export type Totals = {
    currency: string;
    /** Per line, in the order currency (minor units). */
    unit_minor: number[];
    line_minor: number[];
    items_minor: number;
    shipping_minor: number;
    discount_minor: number;
    /** VAT charged on top ("added" mode). */
    tax_minor: number;
    /** VAT contained in the gross prices ("included" mode), shown for information. */
    tax_included_minor: number;
    total_minor: number;
};

export function compute_totals({ lines, shipping_eur, discount_eur = 0, currency, rate, tax }: TotalsInput): Totals {
    if (currency !== BASE_CURRENCY && !(rate > 0)) throw new Error(`No exchange rate for ${currency}`);

    const minor = (eur: number) => to_minor(convert_eur(eur, currency, rate), currency);

    const unit_minor = lines.map((l) => minor(l.unit_price_eur));
    const line_minor = lines.map((l, i) => unit_minor[i] * l.quantity);

    const items_minor = line_minor.reduce((a, b) => a + b, 0);
    const shipping_minor = minor(shipping_eur);
    const discount_minor = Math.min(minor(discount_eur), items_minor);

    const taxable = items_minor + shipping_minor - discount_minor;
    const rate_fraction = Math.max(0, tax.rate) / 100;

    const tax_minor = tax.mode === "added" ? Math.round(taxable * rate_fraction) : 0;
    const tax_included_minor = tax.mode === "included" ? taxable - Math.round(taxable / (1 + rate_fraction)) : 0;

    return {
        currency,
        unit_minor,
        line_minor,
        items_minor,
        shipping_minor,
        discount_minor,
        tax_minor,
        tax_included_minor,
        total_minor: items_minor + shipping_minor + tax_minor - discount_minor,
    };
}
