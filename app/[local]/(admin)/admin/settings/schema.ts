import { z } from "zod";
import { WEEKDAYS } from "@/types/settings";

const text = (max: number) => z.string().trim().max(max);
const url = z.union([z.literal(""), z.string().trim().url("Enter a full URL starting with https://").max(500)]);

/** Admin → Settings. Shared by the form (browser) and the save action (server). */
export const settings_schema = z.object({
    store_name: text(80).min(1, "Store name is required"),
    legal_name: text(160).min(1, "Legal company name is required"),
    representative: text(160),
    address: z.object({ street: text(160), postcode: text(20), city: text(80), country: text(80) }),
    phone: text(40),
    email: z.string().trim().email("Enter a valid email").max(200),
    whatsapp: z
        .string()
        .trim()
        .transform((v) => v.replace(/[^\d]/g, ""))
        .pipe(z.union([z.literal(""), z.string().min(7, "Use the international number, e.g. 4915112345678").max(20)])),
    instagram_url: url,
    chrono24_url: url,
    ebay_url: url,
    vat_id: text(40),
    about_text: text(5000),
    register_court: text(120),
    register_number: text(40),

    arbitration_participates: z.boolean(),
    arbitration_board: text(300),

    opening_hours: z.object(Object.fromEntries(WEEKDAYS.map((d) => [d, text(60)])) as Record<(typeof WEEKDAYS)[number], ReturnType<typeof text>>),
    parking_url: url,

    tax: z.object({ mode: z.enum(["included", "added", "margin_scheme"]), rate: z.coerce.number().min(0).max(100) }),

    bank: z.object({ account_holder: text(160), bank_name: text(160), iban: text(64), bic: text(20) }),
    reservation_days: z.coerce.number().int().min(1).max(60),
    order_prefix: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{2,8}$/, "2–8 letters or digits"),

    payments: z.object({ paypal: z.boolean(), bank_transfer: z.boolean(), stripe: z.boolean(), local_pickup: z.boolean() }),

    notification_emails: z.array(z.string().trim().email("One of the notification emails is not valid")).max(10),
})
    // § 36 VSBG: a shop that takes part has to name the board.
    .refine((s) => !s.arbitration_participates || s.arbitration_board, { path: ["arbitration_board"], message: "Name the arbitration board" });

export type SettingsInput = z.input<typeof settings_schema>;
