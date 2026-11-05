import { z } from "zod";
import { slug_problem } from "@/app/(site)/lib/private_demo_slugs";
import { sanitizeRef } from "@/i18n/brand";
import { DEMO_CATEGORIES, DEMO_CURRENCIES, DEMO_LANGUAGES, DEMO_PIECE_KINDS, MAX_DEMO_PIECES, MAX_PIECE_PHOTOS } from "@/types/private_demo";

/** Optional text detail: empty means "not known". */
const text = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((v) => v || undefined)
        .optional();
/** Optional number detail: missing means "not known". */
const number = (min: number, max: number) => z.number("Enter a number").min(min).max(max).optional();

const details_schema = z.object({
    condition: z.enum(["New", "Pre-Owned"]).optional(),
    gender: z.enum(["Men", "Women"]).optional(),
    reference: text(40),
    year: number(1900, 2100),
    movement: z.enum(["Automatic", "Manual", "Quartz"]).optional(),
    caseMaterial: text(80),
    caseDiameterMm: number(10, 70),
    braceletMaterial: text(80),
    dialColor: text(80),
    waterResistanceM: number(1, 12000),
    metal_type: z.enum(["Gold", "White Gold", "Silver", "Platinum"]).optional(),
    karats: number(8, 24),
    stones: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
    weight_g: number(0.1, 5000),
    ring_size: text(10),
    length_cm: number(1, 200),
});

const piece_schema = z.object({
    id: z.string().regex(/^[a-z0-9-]{3,40}$/),
    title: z.string().trim().min(1, "Enter a title").max(120),
    price: z.number("Enter a price").positive("Enter a positive price").max(1e9),
    description: z.string().trim().min(1, "Enter a description").max(3000),
    photos: z.array(z.string().regex(/^[0-9a-f-]{36}$/)).min(1, "Add at least one photo").max(MAX_PIECE_PHOTOS, `At most ${MAX_PIECE_PHOTOS} photos`),
    kind: z.enum(DEMO_PIECE_KINDS).optional(),
    brand: z
        .string()
        .trim()
        .max(60)
        .transform((brand) => brand || undefined)
        .optional(),
    details: details_schema.optional(),
});

/** "@dn.watches", "instagram.com/dn.watches/" or "dn.watches" → "dn.watches". */
export function instagram_handle(raw: string): string {
    return raw
        .trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/[/?#].*$/, "");
}

/** A private demo as the admin form sends it. Shared by the browser and the server action. */
export const demo_schema = z
    .object({
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .superRefine((slug, ctx) => {
                const problem = slug_problem(slug);
                if (problem) ctx.addIssue({ code: "custom", message: problem });
            }),
        // The name becomes the visitor's ref (the store name everywhere), so it must survive sanitizeRef unchanged.
        name: z
            .string()
            .trim()
            .refine((name) => sanitizeRef(name) === name, "2–24 characters: letters, digits, spaces and . & ' - only"),
        instagram: z
            .string()
            .transform(instagram_handle)
            .pipe(z.string().regex(/^[A-Za-z0-9._]{0,30}$/, "Letters, digits, dots and underscores only"))
            .transform((handle) => handle || undefined)
            .optional(),
        category: z.enum(DEMO_CATEGORIES),
        language: z.enum(DEMO_LANGUAGES),
        currency: z.enum(DEMO_CURRENCIES),
        pieces: z
            .array(piece_schema)
            .min(1, "Add at least one piece")
            .max(MAX_DEMO_PIECES, `At most ${MAX_DEMO_PIECES} pieces`)
            .refine((pieces) => new Set(pieces.map((p) => p.id)).size == pieces.length, "Duplicate piece"),
    })
    .superRefine((demo, ctx) => {
        // Jewelry has to say which storefront category it belongs to (rings, bracelets or necklaces).
        if (demo.category == "watches") return;
        demo.pieces.forEach((piece, i) => {
            if (!piece.kind || (demo.category == "jewelry" && piece.kind == "watch")) ctx.addIssue({ code: "custom", path: ["pieces", i, "kind"], message: "Choose what this piece is" });
        });
    });

export type DemoFormValues = z.input<typeof demo_schema>;
