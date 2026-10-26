import "server-only";

import { cookies } from "next/headers";
import { get_settings } from "./settings";
import { DEFAULT_BRAND } from "@/i18n/brand";
import type { PublicStoreDetails, StoreSettings } from "@/types/settings";

/**
 * Store name / contact details as the visitor should see them.
 *
 * Settings come first. The ?ref= pitch link (sets the `ref` cookie) still overrides the name and
 * the email domain, so a demo can be shown "as" a prospective dealer's shop.
 */
export async function store_identity(): Promise<StoreSettings & { ref?: string }> {
    const settings = await get_settings();
    const ref = (await cookies()).get("ref")?.value;
    if (!ref) return settings;

    return { ...settings, ref, store_name: ref, email: `info@${ref.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` };
}

export function public_details(s: StoreSettings): PublicStoreDetails {
    return {
        store_name: s.store_name,
        address: s.address,
        phone: s.phone,
        email: s.email,
        whatsapp: s.whatsapp,
        instagram_url: s.instagram_url,
        chrono24_url: s.chrono24_url,
        ebay_url: s.ebay_url,
    };
}

/** Brand to write into the translations instead of "Orvella" (undefined = keep the default). */
export async function brand_for_messages(): Promise<string | undefined> {
    const { store_name, ref } = await store_identity();
    if (ref) return ref;
    return store_name.toLowerCase() === DEFAULT_BRAND.toLowerCase() ? undefined : store_name;
}
