import { z } from "zod";

/*
 * Product form schema shared by the admin editor (browser) and the save action (server).
 * Mirrors app/types/watch.ts, jewelry.ts, spare.ts and item.ts. Stock state (status,
 * reservations), relevance and dates are managed by the system, not by this form.
 */

const text = (max: number) => z.string().trim().max(max);
const required_text = (max: number, what: string) => z.string().trim().min(1, `${what} is required`).max(max);
const list = z.array(z.string().trim().min(1).max(120)).max(50);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const base = {
    slug: z.union([z.literal(""), z.string().trim().max(160).regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes")]),
    price: z.coerce.number({ error: "Enter a price" }).positive("Price must be above 0").max(1_000_000_000),
    condition: z.enum(["New", "Pre-Owned"]),
    gender: z.enum(["Men", "Women"]),
    images: z.array(z.string().min(1).max(1000)).min(1, "Add at least one image").max(40),
    video: z.union([z.literal(""), z.string().max(1000)]).optional(),
    description: text(5000),
    featured: z.boolean(),
    /** Units for sale. Watches and jewelry are one-of-one (always 1); spares can be stocked. */
    quantity: z.coerce.number().int().min(0).max(100_000),
    /** Optional tag for ?ref= dealer previews: items with a preview tag only show for that ref. */
    preview: z.union([z.literal(""), text(24)]).optional(),
};

const watch_fields = {
    brand: required_text(80, "Brand"),
    model: required_text(160, "Model"),
    reference: text(80),
    year: z.coerce.number().int().min(0).max(2100),
    movement: z.enum(["Automatic", "Manual", "Quartz"]),
    caseMaterial: text(80),
    caseDiameterMm: z.coerce.number().min(0).max(100),
    braceletMaterial: text(80),
    dialColor: text(80),
    waterResistanceM: z.coerce.number().int().min(0).max(20_000),
    boxPapers: z.object({ box: z.boolean(), papers: z.boolean(), firstInvoice: z.boolean(), serviceInvoice: z.boolean() }),
};

export const SPARE_CATEGORIES = ["Dial", "Hands", "Crown", "Crystal", "Bracelet", "Bezel", "Movement", "Battery", "Caseback", "Stem", "Other"] as const;

const jewelry_fields = {
    display_name: required_text(200, "Name"),
    weight: z.coerce.number().min(0).max(100_000),
    measurement_unit: z.enum(["grams", "ounces"]),
    metal_type: z.enum(["Gold", "White Gold", "Silver", "Platinum"]),
    fineness: z.coerce.number().min(0).max(1000).optional(),
    karats: z.coerce.number().min(0).max(24).optional(),
    stones: list,
};

const length_fields = {
    length: z.coerce.number().min(0).max(1000),
    length_unit: z.enum(["cm", "inches"]),
    clasp_type: text(80).optional(),
};

export const product_schema = z.discriminatedUnion("type", [
    z.object({ ...base, ...watch_fields, type: z.literal("watch") }),
    z.object({
        ...base,
        ...watch_fields,
        type: z.literal("spare"),
        partName: required_text(160, "Part name"),
        spareCategory: z.enum(SPARE_CATEGORIES),
        compatibleModels: list,
        tags: list,
    }),
    z.object({ ...base, ...jewelry_fields, type: z.literal("ring"), ring_size: z.union([z.coerce.number().min(0).max(100), text(20)]), band_width: z.coerce.number().min(0).max(100).optional() }),
    z.object({ ...base, ...jewelry_fields, ...length_fields, type: z.literal("bracelet") }),
    z.object({ ...base, ...jewelry_fields, ...length_fields, type: z.literal("necklace") }),
]);

export type ProductInput = z.input<typeof product_schema>;
export type ProductData = z.output<typeof product_schema>;
export type ProductType = ProductData["type"];

export const PRODUCT_TYPES: ProductType[] = ["watch", "ring", "bracelet", "necklace", "spare"];

/** "Mühle-Glashütte 29er" -> "muhle-glashutte-29er" */
export function slugify(value: string): string {
    return value
        .replace(/ß/g, "ss")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

/** The name a product is listed under (and the default for its slug). */
export function product_title(data: Partial<ProductInput>): string {
    if (data.type == "watch" || data.type == "spare") return [data.brand, data.model, data.reference].filter(Boolean).join(" ");
    return (data as { display_name?: string }).display_name ?? "";
}
