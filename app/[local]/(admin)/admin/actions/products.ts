"use server";

import { revalidatePath } from "next/cache";
import { items_collection } from "@/app/db/collections";
import { rename_in_carts } from "@/app/server/cart";
import { require_admin } from "@/app/server/admin_auth";
import { admin_set_status, invalidate_items, write_item_fields } from "@/app/server/inventory";
import { delete_files, is_stored_url } from "@/app/server/storage";
import { is_unique_type } from "@/app/(site)/lib/stock";
import { product_schema, product_title, slugify, type ProductData } from "../products/schema";
import type { Item } from "@/types/item";

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string; fields?: Record<string, string> };

/** Media must be our own uploads or files that already ship with the site (e.g. /uploads/...). */
function is_allowed_media(url: string): boolean {
    if (is_stored_url(url, "product_image") || is_stored_url(url, "product_video")) return true;
    return url.startsWith("/") && !url.startsWith("//") && !url.includes("..");
}

async function unique_slug(wanted: string, except?: string): Promise<string> {
    const items = await items_collection();
    const base = wanted || "item";

    for (let n = 1; ; n++) {
        const candidate = n == 1 ? base : `${base}-${n}`;
        const taken = await items.findOne({ slug: candidate, ...(except ? { slug: { $eq: candidate, $ne: except } } : {}) }, { projection: { _id: 1 } });
        if (!taken) return candidate;
    }
}

/** Delete stored files no product refers to any more. Site assets (/uploads/...) are never touched. */
async function delete_unused_media(urls: string[]) {
    const ours = urls.filter((u) => is_stored_url(u, "product_image") || is_stored_url(u, "product_video"));
    if (!ours.length) return;

    const items = await items_collection();
    const still_used = await items.find({ $or: [{ images: { $in: ours } }, { video: { $in: ours } }] }, { projection: { images: 1, video: 1 } }).toArray();
    const used = new Set(still_used.flatMap((i) => [...(i.images ?? []), i.video].filter(Boolean) as string[]));

    await delete_files(ours.filter((u) => !used.has(u)));
}

function refresh(slugs: string[]) {
    invalidate_items(slugs);
    revalidatePath("/", "layout");
}

/** Fields the form controls, in the shape stored on the item. */
function stored_fields(data: ProductData, slug: string): Record<string, unknown> {
    const { slug: _slug, video, preview, ...rest } = data;
    void _slug;

    const fields: Record<string, unknown> = {
        ...rest,
        slug,
        video: video || undefined,
        preview: preview || undefined,
        currency: "EUR",
        quantity: is_unique_type(data.type) ? Math.min(1, data.quantity) : data.quantity,
    };

    if (data.type == "watch" || data.type == "spare") {
        fields.brandSlug = slugify(data.brand);
        fields.display_name = product_title(data);
    }

    // Drop undefined so optional fields are removed rather than stored as null.
    return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
}

export async function save_product(input: unknown, original_slug?: string): Promise<SaveResult> {
    await require_admin();

    const parsed = product_schema.safeParse(input);
    if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
        return { ok: false, error: "Please fix the highlighted fields.", fields };
    }

    const data = parsed.data;
    const media = [...data.images, ...(data.video ? [data.video] : [])];
    if (!media.every(is_allowed_media)) return { ok: false, error: "One of the images or the video is not an uploaded file." };

    const items = await items_collection();
    const existing = original_slug ? await items.findOne({ slug: original_slug }) : null;
    if (original_slug && !existing) return { ok: false, error: "This product no longer exists." };

    const slug = await unique_slug(slugify(data.slug || product_title(data)), original_slug);
    const fields = stored_fields(data, slug);

    if (!existing) {
        const now = new Date();
        await items.insertOne({ ...fields, date_added: now, updated_at: now, relevance_score: 0, reservations: [], inStock: true, status: "available" } as unknown as Item);
        // Derive status/inStock from the quantity that was entered.
        await write_item_fields(slug, {});
        refresh([slug]);
        return { ok: true, slug };
    }

    // Fields a type no longer has (e.g. switching ring -> necklace) are removed.
    const removed = Object.keys(existing).filter((k) => !(k in fields) && !["_id", "date_added", "relevance_score", "reservations", "status", "inStock", "sold_at", "deleted", "deleted_at", "updated_at", "type"].includes(k));
    if (removed.length) await items.updateOne({ slug: original_slug }, { $unset: Object.fromEntries(removed.map((k) => [k, ""])) });

    // Unique pieces keep their stock state; the form only edits quantity for spare parts.
    if (is_unique_type(data.type)) delete fields.quantity;

    await write_item_fields(original_slug!, fields);

    if (slug !== original_slug) {
        // Keep customers' carts pointing at the piece.
        await rename_in_carts(original_slug!, slug);
    }

    const old_media = [...(existing.images ?? []), ...(existing.video ? [existing.video] : [])];
    await delete_unused_media(old_media.filter((u) => !media.includes(u)));

    refresh([original_slug!, slug]);
    return { ok: true, slug };
}

export async function set_product_status(slug: string, status: "available" | "reserved" | "sold"): Promise<boolean> {
    await require_admin();
    const item = await (await items_collection()).findOne({ slug }, { projection: { type: 1 } });
    if (!item || !["available", "reserved", "sold"].includes(status)) return false;

    const ok = await admin_set_status(slug, status, is_unique_type(item.type));
    refresh([slug]);
    return ok;
}

export async function toggle_featured(slug: string): Promise<boolean> {
    await require_admin();
    const result = await (await items_collection()).updateOne({ slug }, [{ $set: { featured: { $not: ["$featured"] }, updated_at: "$$NOW" } }]);
    refresh([slug]);
    return result.modifiedCount === 1;
}

export async function duplicate_product(slug: string): Promise<SaveResult> {
    await require_admin();
    const items = await items_collection();

    const source = await items.findOne({ slug }, { projection: { _id: 0 } });
    if (!source) return { ok: false, error: "Product not found." };

    const copy_slug = await unique_slug(`${slug}-copy`);
    const now = new Date();
    const { reservations, sold_at, deleted, ...rest } = source;
    void reservations;
    void sold_at;
    void deleted;

    await items.insertOne({
        ...rest,
        slug: copy_slug,
        display_name: `${source.display_name ?? product_title(source as never)} (copy)`,
        quantity: is_unique_type(source.type) ? 1 : Math.max(1, source.quantity ?? 1),
        reservations: [],
        status: "available",
        inStock: true,
        featured: false,
        relevance_score: 0,
        date_added: now,
        updated_at: now,
    } as Item);

    refresh([copy_slug]);
    return { ok: true, slug: copy_slug };
}

/** Soft delete: hidden from the storefront and searches, restorable from the admin. */
export async function delete_product(slug: string): Promise<boolean> {
    await require_admin();
    const result = await (await items_collection()).updateOne({ slug }, { $set: { deleted: true, deleted_at: new Date(), updated_at: new Date() } });
    refresh([slug]);
    return result.modifiedCount === 1;
}

export async function restore_product(slug: string): Promise<boolean> {
    await require_admin();
    const result = await (await items_collection()).updateOne({ slug }, { $unset: { deleted: "", deleted_at: "" }, $set: { updated_at: new Date() } });
    refresh([slug]);
    return result.modifiedCount === 1;
}
