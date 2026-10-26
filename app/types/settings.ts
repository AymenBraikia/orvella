import type { TaxMode } from "./order";

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Store-wide configuration, edited in Admin → Settings. One document in the `settings` collection. */
export interface StoreSettings {
    store_name: string;
    legal_name: string;
    representative: string;
    address: {
        street: string;
        postcode: string;
        city: string;
        country: string;
    };
    phone: string;
    email: string;
    /** International format without "+" or spaces, e.g. 4915112345678 (used for wa.me links). */
    whatsapp: string;
    instagram_url: string;
    /** Optional dealer profiles on marketplaces, shown in the footer when set. */
    chrono24_url: string;
    ebay_url: string;
    vat_id: string;

    /** Free text per day, e.g. "11:00 – 17:00"; empty means closed. */
    opening_hours: Record<Weekday, string>;
    /** Optional Google Maps link to nearby parking (store page). */
    parking_url: string;

    tax: {
        mode: TaxMode;
        /** Percent, e.g. 19. */
        rate: number;
    };

    bank: {
        account_holder: string;
        bank_name: string;
        iban: string;
        bic: string;
    };
    /** Order numbers look like PREFIX-2026-000123. */
    order_prefix: string;

    /** How long a bank transfer order holds the pieces before they go back on sale. */
    reservation_days: number;

    payments: {
        paypal: boolean;
        bank_transfer: boolean;
        stripe: boolean;
        local_pickup: boolean;
    };

    /** Who gets new order / lead / appointment emails. */
    notification_emails: string[];

    updated_at?: Date | string;
}

/** The part of the settings that may be sent to the browser (no bank details or notification emails). */
export type PublicStoreDetails = Pick<StoreSettings, "store_name" | "address" | "phone" | "email" | "whatsapp" | "instagram_url" | "chrono24_url" | "ebay_url">;
