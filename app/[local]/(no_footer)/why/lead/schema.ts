import { z } from "zod";

export type LeadMessages = { required: string; invalidContact: string; invalidLink: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 6–15 digits, optionally with +, spaces, dashes, dots or brackets, as people write phone numbers. */
const PHONE = /^\+?[\d\s().-]{6,24}$/;

export const is_email = (value: string) => EMAIL.test(value);

/** "Book your custom demo" form on /why, shared by the browser and the server action. */
export function lead_schema(m: LeadMessages = { required: "required", invalidContact: "invalid contact", invalidLink: "invalid link" }) {
    return z.object({
        name: z.string().trim().min(1, m.required).max(120),
        business: z.string().trim().min(1, m.required).max(160),
        contact: z
            .string()
            .trim()
            .min(1, m.required)
            .max(200)
            .refine((v) => is_email(v) || (PHONE.test(v) && v.replace(/\D/g, "").length >= 6 && v.replace(/\D/g, "").length <= 15), m.invalidContact),
        // A link (with or without https://) or an Instagram-style @handle.
        stock_url: z
            .string()
            .trim()
            .min(1, m.required)
            .max(300)
            .refine((v) => /^@[\w.]{2,30}$/.test(v) || /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/i.test(v), m.invalidLink),
        message: z.string().trim().max(3000).optional(),
    });
}

export type LeadInput = z.input<ReturnType<typeof lead_schema>>;
