import "server-only";

import { DEFAULT_SETTINGS, get_settings } from "./settings";
import { active_ref } from "./ref";
import { demo_by_ref } from "./private_demos";
import { current_demo } from "./storefront";
import { instagram_url } from "@/app/(site)/lib/storefront";
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

    // A lead demo (/<locale>/<demo>): the seller's name and their only real contact, Instagram. No
    // address, phone, email or other profiles, and never the ?ref= cookie.
    const lead = current_demo();
    if (lead) {
        return {
            ...settings,
            store_name: lead.name,
            // The demo's own address, hours and About text; other legal details are left out (never placeholders).
            legal_name: lead.name,
            representative: "",
            vat_id: "",
            register_court: "",
            register_number: "",
            about_text: lead.store?.about ?? "",
            parking_url: "",
            opening_hours: Object.fromEntries(Object.keys(settings.opening_hours).map((day) => [day, lead.store?.opening_hours[day] ?? ""])) as StoreSettings["opening_hours"],
            // Bank transfer would show the demo site's placeholder bank details, pickup needs an address.
            payments: { ...settings.payments, bank_transfer: false, local_pickup: false },
            address: lead.store?.address ?? { street: "", postcode: "", city: "", country: "" },
            phone: "",
            email: "",
            whatsapp: lead.whatsapp ?? "",
            chrono24_url: "",
            ebay_url: "",
            instagram_url: lead.instagram ? instagram_url(lead.instagram) : "",
        };
    }

    const ref = await active_ref();
    if (!ref) return settings;

    // A private demo is a real seller: only their own Instagram, never the demo site's profiles or a made-up email.
    const demo = await demo_by_ref(ref);
    if (demo) {
        return { ...settings, ref, store_name: ref, email: "", whatsapp: "", chrono24_url: "", ebay_url: "", instagram_url: demo.instagram ? `https://www.instagram.com/${demo.instagram}/` : "" };
    }

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
        about_text: DEFAULT_SETTINGS.about_text,
        register_court: "Amtsgericht Your City",
        register_number: "HRB 00000",
        bank: DEFAULT_SETTINGS.bank,
    };
}

/**
 * Address, phone and email as shown on public pages. On the demo they are placeholders (see demo_safe),
 * which look like an unfilled template, so they come back empty and the pages leave them out.
 * A ?ref= preview keeps its generated email.
 */
export function shown_contact(s: Pick<StoreSettings, "address" | "phone" | "email">): Pick<StoreSettings, "address" | "phone" | "email"> {
    if (!DEMO_MODE || current_demo()) return { address: s.address, phone: s.phone, email: s.email };
    return { address: { street: "", postcode: "", city: "", country: "" }, phone: "", email: s.email == DEFAULT_SETTINGS.email ? "" : s.email };
}

export function public_details(s: StoreSettings): PublicStoreDetails {
    return {
        store_name: s.store_name,
        ...shown_contact(s),
        whatsapp: s.whatsapp,
        instagram_url: s.instagram_url,
        chrono24_url: s.chrono24_url,
        ebay_url: s.ebay_url,
    };
}

/** Brand to write into the translations instead of "Corlane" (undefined = keep the default). */
export async function brand_for_messages(): Promise<string | undefined> {
    const { store_name, ref } = await store_identity();
    if (ref || current_demo()) return ref ?? store_name;
    return store_name.toLowerCase() === DEFAULT_BRAND.toLowerCase() ? undefined : store_name;
}
