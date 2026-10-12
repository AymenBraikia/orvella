import { unstable_cache } from "next/cache";
import { Supported_Currencies, supported_currencies, eur_value_in_currency } from "@/currency";

async function update_values(): Promise<Map<Supported_Currencies, number>> {
    const rates = ((await (await fetch(`https://open.er-api.com/v6/latest/EUR`)).json()) as { rates: Record<Supported_Currencies, number> }).rates;

    for (const cur of supported_currencies) eur_value_in_currency.set(cur, rates[cur]);
    return eur_value_in_currency;
}

const update_currency_rates = () =>
    unstable_cache(update_values, [], {
        revalidate: 60 * 60,
        tags: ["currency", ...supported_currencies],
    })();

export default update_currency_rates;
