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
type EU = "AD" | "AT" | "BE" | "BG" | "CY" | "DE" | "EE" | "ES" | "FI" | "FR" | "GR" | "HR" | "IE" | "IT" | "LT" | "LU" | "LV" | "MC" | "ME" | "MT" | "NL" | "PT" | "SI" | "SK" | "SM" | "VA" | "XK";
// type ME = "SA" | "AE" | "QA" | "KW" | "BH";

export type Supported_Countries = "US" | "GB" | "CA" | "AU" | "CN" | "SG" | "JP" | "HK" | EU; //| ME;

export const currencyByCountry: Record<Supported_Countries, Supported_Currencies> = {
    US: "USD",
    CA: "CAD",
    AU: "AUD",
    SG: "SGD",
    HK: "HKD",

    GB: "GBP",

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

export function set_rates(rates: ExchangeRates) {
    for (const [currency, rate] of Object.entries(rates)) if (rate) eur_value_in_currency.set(currency as Supported_Currencies, rate);
}
