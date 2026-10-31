import { charge_mode, eur_value_in_currency, Supported_Countries, Supported_Currencies } from "@/currency";
import { calc_price } from "./calc_price";
import { currency_decimals } from "./order_totals";

function money(amount: number, currency: string, decimals: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
}

/** Catalogue display: "€24,900" rather than "€24,900.00", with the cents only when there are some. */
function catalogue_money(amount: number, currency: string): string {
    return money(amount, currency, Number.isInteger(amount) ? 0 : currency_decimals(currency));
}

/** When checkout charges EUR, any other currency is only an estimate of what the customer will pay. */
function mark_estimate(price: string, currency: string): string {
    return charge_mode.current == "EUR" && currency != "EUR" ? `≈ ${price}` : price;
}

/** Format a EUR catalogue price in the visitor's currency. */
export function format_price(n: number, currency: Supported_Currencies = "USD"): string {
    // No exchange rate (rate service down): show the real EUR price rather than a mislabelled number.
    if (currency !== "EUR" && !eur_value_in_currency.get(currency)) return catalogue_money(n, "EUR");
    return mark_estimate(catalogue_money(calc_price(n, currency), currency), currency);
}

/** Format an amount that is already in `currency` (order totals) — no conversion, always exact. */
export function format_money(amount: number, currency: string): string {
    return money(amount, currency, currency_decimals(currency));
}

/** Exact amount in the visitor's currency, before checkout (cart totals). */
export function format_cart_money(amount: number, currency: string): string {
    return mark_estimate(format_money(amount, currency), currency);
}

export const country_to_currency: Map<Supported_Countries, Supported_Currencies> = new Map([
    ["US", "USD"],
    ["CA", "CAD"],
    ["AU", "AUD"],
    ["SG", "SGD"],
    ["HK", "HKD"],
    ["GB", "GBP"],
    ["CH", "CHF"],
    ["LI", "CHF"],
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
    ["SE", "EUR"],
    ["DK", "EUR"],
    ["NO", "EUR"],
    ["PL", "EUR"],
    ["CZ", "EUR"],
    ["HU", "EUR"],
    ["RO", "EUR"],
    ["IS", "EUR"],
]);
