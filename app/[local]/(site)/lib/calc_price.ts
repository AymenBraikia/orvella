import { eur_value_in_currency, Supported_Currencies } from "@/currency";
import { convert_eur } from "./order_totals";

/** Display conversion from EUR; uses the same rounding as order totals so the cart matches the charge. */
export function calc_price(n: number, c: Supported_Currencies): number {
    const rate = eur_value_in_currency.get(c) || 1;
    return convert_eur(n, c, rate);
}
