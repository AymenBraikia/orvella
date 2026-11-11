import "server-only";

import { unstable_cache } from "next/cache";
import { ExchangeRates, set_charge_mode, set_rates, Supported_Currencies, supported_currencies } from "@/currency";
import { get_settings } from "./settings";

/** Fetched at most once an hour per deployment, never from the browser. */
const fetch_rates = unstable_cache(
    async (): Promise<ExchangeRates> => {
        const res = await fetch("https://open.er-api.com/v6/latest/EUR");
        if (!res.ok) throw new Error(`Exchange rates request failed (${res.status})`);
        const { rates } = (await res.json()) as { rates: Record<Supported_Currencies, number> };
        return Object.fromEntries(supported_currencies.map((c) => [c, rates[c]]));
    },
    ["currency:rates"],
    { revalidate: 60 * 60, tags: ["currency"] },
);

/**
 * Make sure the rates are loaded (for formatting prices on the server) and return them (for the
 * browser). If the rate service is down, prices are shown in EUR and non-EUR checkouts are refused.
 */
export default async function load_rates(): Promise<ExchangeRates> {
    set_charge_mode((await get_settings()).charge_currency);

    try {
        const rates = await fetch_rates();
        set_rates(rates);
        return rates;
    } catch (error) {
        console.error("Could not load exchange rates", error);
        return {};
    }
}
