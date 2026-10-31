import "server-only";

import { unstable_cache } from "next/cache";
import { settings_collection } from "../db/collections";
import type { StoreSettings } from "@/types/settings";

/**
 * Used until the dealer saves their own settings in the admin. Deliberately obvious placeholders:
 * nothing here should look like a real business.
 */
export const DEFAULT_SETTINGS: StoreSettings = {
    store_name: "ORVELLA",
    legal_name: "Your Company GmbH",
    representative: "Your Name",
    address: {
        street: "Your street 1",
        postcode: "00000",
        city: "Your city",
        country: "Germany",
    },
    phone: "+49 000 0000000",
    email: "info@example.com",
    whatsapp: "",
    instagram_url: "",
    chrono24_url: "",
    ebay_url: "",
    vat_id: "DE000000000",
    about_text: "",
    register_court: "",
    register_number: "",

    arbitration_participates: false,
    arbitration_board: "",

    opening_hours: { monday: "11:00 – 17:00", tuesday: "11:00 – 17:00", wednesday: "11:00 – 17:00", thursday: "11:00 – 17:00", friday: "11:00 – 17:00", saturday: "11:00 – 17:00", sunday: "" },
    parking_url: "",

    tax: { mode: "included", rate: 19 },

    bank: {
        account_holder: "Your Company GmbH",
        bank_name: "Your Bank",
        iban: "DE00 0000 0000 0000 0000 00",
        bic: "XXXXDEXXXXX",
    },
    reservation_days: 3,
    order_prefix: "ORV",

    payments: { paypal: true, bank_transfer: true, stripe: false, local_pickup: true },

    notification_emails: [],
};

export const SETTINGS_ID = "store";

function with_defaults(saved: Partial<StoreSettings> | null): StoreSettings {
    const s = saved ?? {};
    return {
        ...DEFAULT_SETTINGS,
        ...s,
        address: { ...DEFAULT_SETTINGS.address, ...s.address },
        opening_hours: { ...DEFAULT_SETTINGS.opening_hours, ...s.opening_hours },
        tax: { ...DEFAULT_SETTINGS.tax, ...s.tax },
        bank: { ...DEFAULT_SETTINGS.bank, ...s.bank },
        payments: { ...DEFAULT_SETTINGS.payments, ...s.payments },
        notification_emails: s.notification_emails ?? DEFAULT_SETTINGS.notification_emails,
    };
}

const get_cached_settings = unstable_cache(
    async (): Promise<StoreSettings> => {
        const doc = await (await settings_collection()).findOne({ _id: SETTINGS_ID }, { projection: { _id: 0 } });
        return JSON.parse(JSON.stringify(with_defaults(doc)));
    },
    ["settings"],
    { revalidate: 3600, tags: ["settings"] },
);

/** Store settings, cached; the admin revalidates the "settings" tag on save. */
export async function get_settings(): Promise<StoreSettings> {
    try {
        return await get_cached_settings();
    } catch (error) {
        console.error("Could not load settings, using defaults", error);
        return DEFAULT_SETTINGS;
    }
}
