import { Supported_Countries, Supported_Currencies } from "@/currency";
import { calc_price } from "./calc_price";
import { currency_decimals } from "./order_totals";

/** Format a EUR catalogue price in the visitor's currency. */
export function format_price(n: number, currency: Supported_Currencies = "USD"): string {
    return format_money(calc_price(n, currency), currency);
}

/** Format an amount that is already in `currency` (order totals) — no conversion. */
export function format_money(amount: number, currency: string): string {
    const decimals = currency_decimals(currency);
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
}

export const country_to_currency: Map<Supported_Countries, Supported_Currencies> = new Map([
    ["US", "USD"],
    ["CA", "CAD"],
    ["AU", "AUD"],
    ["SG", "SGD"],
    ["HK", "HKD"],
    ["GB", "GBP"],
    ["CN", "CNY"],
    ["JP", "JPY"],
    // ["AE", "AED"],
    // ["SA", "SAR"],
    // ["QA", "QAR"],
    // ["KW", "KWD"],
    // ["BH", "BHD"],
    ["AD", "EUR"],
    ["AT", "EUR"],
    ["BE", "EUR"],
    ["BG", "EUR"],
    ["CY", "EUR"],
    ["DE", "EUR"],
    ["EE", "EUR"],
    ["ES", "EUR"],
    ["FI", "EUR"],
    ["FR", "EUR"],
    ["GR", "EUR"],
    ["HR", "EUR"],
    ["IE", "EUR"],
    ["IT", "EUR"],
    ["LT", "EUR"],
    ["LU", "EUR"],
    ["LV", "EUR"],
    ["MC", "EUR"],
    ["ME", "EUR"],
    ["MT", "EUR"],
    ["NL", "EUR"],
    ["PT", "EUR"],
    ["SI", "EUR"],
    ["SK", "EUR"],
    ["SM", "EUR"],
    ["VA", "EUR"],
    ["XK", "EUR"],
]);
