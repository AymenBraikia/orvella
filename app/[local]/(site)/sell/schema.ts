import { z } from "zod";
import { MAX_SELL_IMAGES } from "../lib/upload_rules";

export type FormMessages = {
    required: string;
    invalidEmail: string;
    selectOption: string;
    invalidPrice: string;
    tooManyImages: string;
};

/** Server-side messages are never shown to customers; the form passes translated ones. */
export const SERVER_MESSAGES: FormMessages = {
    required: "required",
    invalidEmail: "invalid email",
    selectOption: "invalid option",
    invalidPrice: "invalid price",
    tooManyImages: "too many images",
};

/** One schema for the sell / consign form, used by the browser (react-hook-form) and the server action. */
export function sell_schema(m: FormMessages = SERVER_MESSAGES) {
    return z.object({
        firstName: z.string().trim().min(1, m.required).max(60),
        lastName: z.string().trim().min(1, m.required).max(60),
        email: z.string().trim().email(m.invalidEmail).max(200),
        phone: z.string().trim().min(1, m.required).max(40),

        intent: z.enum(["consign", "sell"], { error: m.selectOption }),

        brand: z.string().trim().min(1, m.required).max(80),
        price: z.coerce.number({ error: m.invalidPrice }).positive(m.invalidPrice).max(100_000_000, m.invalidPrice),
        model: z.string().trim().max(120).optional(),
        refNum: z.string().trim().max(80).optional(),
        box: z.boolean().optional(),
        papers: z.boolean().optional(),
        condition: z.enum(["new", "mint", "pre-owned"], { error: m.selectOption }),
        images: z.array(z.string().max(1000)).max(MAX_SELL_IMAGES, m.tooManyImages),
        message: z.string().trim().max(3000).optional(),
    });
}

export type SellInput = z.input<ReturnType<typeof sell_schema>>;
export type SellOutput = z.output<ReturnType<typeof sell_schema>>;
