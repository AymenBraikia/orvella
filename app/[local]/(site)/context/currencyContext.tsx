"use client";

import { createContext, useContext } from "react";
import type { Supported_Currencies } from "@/currency";

/**
 * The visitor's display currency, taken from the Currency cookie on the server. Components used to
 * read document.cookie while rendering, which crashed server rendering of the shop pages.
 */
const CurrencyContext = createContext<Supported_Currencies>("USD");

export function CurrencyProvider({ currency, children }: { currency: Supported_Currencies; children: React.ReactNode }) {
    return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
