"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { spares_collection, watches_collection } from "@/app/db/collections";
import { Watch } from "@/types/watch";

import { get_admin_session } from "./session";
import { build_watch_slug, slugify } from "./slug";

export interface ActionResult {
    success: boolean;
    error?: string;
    slug?: string;
}

const bool = (data: FormData, key: string) => data.get(key) === "on" || data.get(key) === "true";
const str = (data: FormData, key: string) => (data.get(key) as string | null)?.trim() ?? "";
const num = (data: FormData, key: string) => Number(data.get(key));

function refresh(slug?: string) {
    revalidateTag("watches", { expire: 0 });
    if (slug) {
        revalidateTag(`watch:${slug}`, { expire: 0 });
        revalidateTag(`item:${slug}`, { expire: 0 });
    }
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/admin/watches");
    if (slug) revalidatePath(`/product/${slug}`);
}
function parse_watch(data: FormData): Watch | string {
    const brand = str(data, "brand");
    const model = str(data, "model");
    const reference = str(data, "reference");

    if (!brand) return "Brand is required.";
    if (!model) return "Model is required.";
    if (!reference) return "Reference is required.";

    const year = num(data, "year");
    const price = num(data, "price");

    if (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear() + 1) return "Enter a valid year.";
    if (!Number.isFinite(price) || price <= 0) return "Enter a valid price.";

    const images = str(data, "images")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (images.length === 0) return "Add at least one image path or URL.";

    return {
        slug: str(data, "slug") || build_watch_slug(brand, model, reference, year),
        brand,
        brandSlug: slugify(brand),
        model,
        reference,
        year,
        price,
        currency: "EUR",
        condition: str(data, "condition") === "New" ? "New" : "Pre-Owned",
        gender: str(data, "gender") === "Women" ? "Women" : "Men",
        movement: (["Automatic", "Manual", "Quartz"].includes(str(data, "movement")) ? str(data, "movement") : "Automatic") as Watch["movement"],
        caseMaterial: str(data, "caseMaterial"),
        caseDiameterMm: num(data, "caseDiameterMm") || 0,
        braceletMaterial: str(data, "braceletMaterial"),
        dialColor: str(data, "dialColor"),
        waterResistanceM: num(data, "waterResistanceM") || 0,
        boxPapers: {
            box: bool(data, "box"),
            papers: bool(data, "papers"),
            firstInvoice: bool(data, "firstInvoice"),
            serviceInvoice: bool(data, "serviceInvoice"),
        },
        images,
        description: str(data, "description"),
        inStock: bool(data, "inStock"),
        featured: bool(data, "featured"),
        type: "watch",
        date_added: new Date(),
        relevance_score: 0,
    };
}

/**
 * Creates or updates a watch.
 * Pass the original slug in `originalSlug` to update, omit it to create.
 */
export async function save_watch(_prev: ActionResult | null, data: FormData): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    const parsed = parse_watch(data);
    if (typeof parsed === "string") return { success: false, error: parsed };

    const originalSlug = str(data, "originalSlug");

    try {
        if (originalSlug) {
            // Never overwrite these on edit: date_added is the original listing date
            // and relevance_score is earned by customer behaviour.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { date_added, relevance_score, ...updatable } = parsed;

            const result = await (await watches_collection()).updateOne({ slug: originalSlug }, { $set: updatable });
            if (result.matchedCount === 0) return { success: false, error: "That watch no longer exists." };
        } else {
            const clash = await (await watches_collection()).findOne({ slug: parsed.slug }, { projection: { slug: 1 } });
            if (clash) return { success: false, error: "A watch with this brand, model, reference and year already exists." };

            await (await watches_collection()).insertOne(parsed);
        }

        refresh(parsed.slug);
        return { success: true, slug: parsed.slug };
    } catch (err) {
        console.error("save_watch failed:", err);
        return { success: false, error: "Could not save. Try again." };
    }
}

export async function delete_watch(slug: string): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        await (await watches_collection()).deleteOne({ slug });
        refresh(slug);
        return { success: true };
    } catch (err) {
        console.error("delete_watch failed:", err);
        return { success: false, error: "Could not delete. Try again." };
    }
}

/** Flips inStock or featured straight from the list, without opening the form. */
export async function toggle_watch_flag(slug: string, field: "inStock" | "featured", value: boolean): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        await (await watches_collection()).updateOne({ slug }, { $set: { [field]: value } });
        refresh(slug);
        return { success: true };
    } catch (err) {
        console.error("toggle_watch_flag failed:", err);
        return { success: false, error: "Could not update. Try again." };
    }
}

export async function delete_spare(slug: string): Promise<ActionResult> {
    if (!(await get_admin_session())) return { success: false, error: "Not authorised." };

    try {
        await (await spares_collection()).deleteOne({ slug });
        revalidateTag("spares", { expire: 0 });
        revalidatePath("/spare");
        revalidatePath("/admin/spares");
        return { success: true };
    } catch (err) {
        console.error("delete_spare failed:", err);
        return { success: false, error: "Could not delete. Try again." };
    }
}
