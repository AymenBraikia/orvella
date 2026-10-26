"use client";

import { createContext, useContext } from "react";
import { set_rates, type ExchangeRates, type Supported_Currencies } from "@/currency";

/**
 * The visitor's display currency, taken from the Currency cookie on the server. Components used to
 * read document.cookie while rendering, which crashed server rendering of the shop pages.
 */
const CurrencyContext = createContext<Supported_Currencies>("USD");

export function CurrencyProvider({ currency, rates, children }: { currency: Supported_Currencies; rates: ExchangeRates; children: React.ReactNode }) {
    // Rates come from the server with the page (the browser never calls the rates API).
    set_rates(rates);
    return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
