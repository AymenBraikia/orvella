import { eur_value_in_currency, Supported_Currencies } from "@/currency";

export function calc_price(n: number, c: Supported_Currencies): number {
    const rate = eur_value_in_currency.get(c) || 1;
    return Math.round(n * rate);
}
