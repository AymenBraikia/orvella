"use client";

import { createContext, useContext, useMemo } from "react";
import { MAIN_STOREFRONT, store_has, store_href, type Storefront } from "../lib/storefront";

const StorefrontContext = createContext<Storefront>(MAIN_STOREFRONT);

export function StorefrontProvider({ store, children }: { store: Storefront; children: React.ReactNode }) {
    return <StorefrontContext.Provider value={store}>{children}</StorefrontContext.Provider>;
}

/** The store being shown (main store outside a provider), with its link helpers. */
export function useStorefront() {
    const store = useContext(StorefrontContext);
    return useMemo(
        () => ({
            store,
            demo: store.demo,
            href: (path: string) => store_href(store, path),
            has: (path: string) => store_has(store, path),
        }),
        [store],
    );
}
