import { Supported_Countries, Supported_Currencies } from "@/currency";
import { calc_price } from "./calc_price";

export function format_price(n: number, currency: Supported_Currencies = "USD"): string {
    const converted = calc_price(n, currency);

    const intl = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    });
    return intl.format(converted);
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
