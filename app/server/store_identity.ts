import "server-only";

import { DEFAULT_SETTINGS, get_settings } from "./settings";
import { active_ref } from "./ref";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { DEFAULT_BRAND } from "@/i18n/brand";
import type { PublicStoreDetails, StoreSettings } from "@/types/settings";

/**
 * Store name / contact details as the visitor should see them.
 *
 * Settings come first. On the demo, the ?ref= pitch link (sets the `ref` cookie) overrides the name
 * and the email domain, so it can be shown "as" a prospective dealer's shop.
 */
export async function store_identity(): Promise<StoreSettings & { ref?: string }> {
    const settings = demo_safe(await get_settings());
    const ref = await active_ref();
    if (!ref) return settings;

    return { ...settings, ref, store_name: ref, email: `info@${ref.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` };
}

/**
 * In DEMO_MODE, legal and payment details are always obvious placeholders — whatever was typed into
 * the demo's settings — so nothing looks like a real business (imprint, privacy, contact, bank).
 */
export function demo_safe(settings: StoreSettings): StoreSettings {
    if (!DEMO_MODE) return settings;
    return {
        ...settings,
        legal_name: DEFAULT_SETTINGS.legal_name,
        representative: DEFAULT_SETTINGS.representative,
        address: { street: "Your address", postcode: "00000", city: "Your city", country: "Germany" },
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        vat_id: DEFAULT_SETTINGS.vat_id,
        bank: DEFAULT_SETTINGS.bank,
    };
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
