export type Supported_Currencies =
    | "USD"
    | "CAD"
    | "AUD"
    | "GBP"
    | "EUR"
    // | "SAR" | "AED" | "QAR" | "KWD" | "BHD"
    | "CHF"
    | "HKD"
    | "JPY"
    | "SGD"
    | "CNY";
/** European countries without the euro, shown EUR rather than falling back to USD. */
type Europe_Non_Euro = "SE" | "DK" | "NO" | "PL" | "CZ" | "HU" | "RO" | "IS";
type EU = "AD" | "AT" | "BE" | "BG" | "CY" | "DE" | "EE" | "ES" | "FI" | "FR" | "GR" | "HR" | "IE" | "IT" | "LT" | "LU" | "LV" | "MC" | "ME" | "MT" | "NL" | "PT" | "SI" | "SK" | "SM" | "VA" | "XK";
// type ME = "SA" | "AE" | "QA" | "KW" | "BH";

export type Supported_Countries = "US" | "GB" | "CA" | "AU" | "CN" | "SG" | "JP" | "HK" | "CH" | "LI" | EU | Europe_Non_Euro; //| ME;

export const currencyByCountry: Record<Supported_Countries, Supported_Currencies> = {
    US: "USD",
    CA: "CAD",
    AU: "AUD",
    SG: "SGD",
    HK: "HKD",

    GB: "GBP",
    CH: "CHF",
    LI: "CHF",

    CN: "CNY",
    JP: "JPY",

    // AE: "AED",
    // SA: "SAR",
    // QA: "QAR",
    // KW: "KWD",
    // BH: "BHD",

    AD: "EUR",
    AT: "EUR",
    BE: "EUR",
    BG: "EUR",
    CY: "EUR",
    DE: "EUR",
    EE: "EUR",
    ES: "EUR",
    FI: "EUR",
    FR: "EUR",
    GR: "EUR",
    HR: "EUR",
    IE: "EUR",
    IT: "EUR",
    LT: "EUR",
    LU: "EUR",
    LV: "EUR",
    MC: "EUR",
    ME: "EUR",
    MT: "EUR",
    NL: "EUR",
    PT: "EUR",
    SI: "EUR",
    SK: "EUR",
    SM: "EUR",
    VA: "EUR",
    XK: "EUR",

    SE: "EUR",
    DK: "EUR",
    NO: "EUR",
    PL: "EUR",
    CZ: "EUR",
    HU: "EUR",
    RO: "EUR",
    IS: "EUR",
};

export const supported_currencies: Supported_Currencies[] = [
    "USD",
    "CAD",
    "AUD",
    "GBP",
    "EUR",
    // "SAR", "AED", "QAR", "KWD", "BHD",
    "CHF",
    "HKD",
    "JPY",
    "SGD",
    "CNY",
];

/** 1 EUR in each currency. Filled on the server (app/server/update_currency_rates.ts) and handed to the browser by CurrencyProvider. */
export const eur_value_in_currency: Map<Supported_Currencies, number> = new Map([]);

export type ExchangeRates = Partial<Record<Supported_Currencies, number>>;

/** Admin → Settings: charge everyone in EUR and only show their currency, or charge in their currency. */
export type ChargeCurrency = "EUR" | "visitor";

/** Filled the same way as the rates, so that format_price knows when a price is only an estimate. */
export const charge_mode: { current: ChargeCurrency } = { current: "visitor" };

export function set_charge_mode(mode: ChargeCurrency) {
    charge_mode.current = mode;
}

export function set_rates(rates: ExchangeRates) {
    for (const [currency, rate] of Object.entries(rates)) if (rate) eur_value_in_currency.set(currency as Supported_Currencies, rate);
}
