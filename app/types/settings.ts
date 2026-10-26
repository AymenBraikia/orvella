import type { TaxMode } from "./order";

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
    vat_id: string;

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
