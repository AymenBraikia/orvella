import "server-only";

import { cache } from "react";
import { randomUUID } from "node:crypto";
import { Binary, MongoServerError } from "mongodb";
import { db, enquiries_collection, items_collection, private_demo_photos_collection, private_demos_collection } from "../db/collections";
import { demo_schema } from "@/app/(admin)/admin/demos/schema";
import { demo_photo_url } from "@/app/(site)/lib/private_demo";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import { piece_kind, type DemoPiece, type PrivateDemo, type PrivateDemoPhoto } from "@/types/private_demo";

/*
 * Private demo stores: one seller, a few of their pieces, opened at corlane.store/<slug>.
 *
 * A demo is the real storefront: its link gives the visitor the seller's name as their ?ref=
 * (see app/api/demo-open), and each piece is a storefront product tagged `preview: <name>`, so the
 * whole store shows the seller's name and only the seller's pieces. Products carry
 * `private_demo: <id>` so they follow the demo (hidden when disabled, removed when deleted).
 * Photos are kept in MongoDB next to the demo; each belongs to exactly one demo.
 */

export const PHOTO_TYPES = ["image/jpeg", "image/webp", "image/png"];
export const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;
/** Upper bound per demo, including photos uploaded and then removed before saving. */
const MAX_PHOTOS_PER_DEMO = 400;
/** Photos uploaded for a demo that was never saved are removed after this. */
const ORPHAN_MS = 24 * 60 * 60_000;
/** What the storefront shows nothing for: unknown watch details (see filters.ts, watch_card.tsx). */
const UNVERIFIED = "UNVERIFIED";

type Plain<T> = T extends Date ? string : T extends object ? { [K in keyof T]: Plain<T[K]> } : T;

function plain<T>(doc: T): Plain<T> {
    return JSON.parse(JSON.stringify(doc));
}

/** The enabled demo at `slug`, or null (disabled and deleted demos are simply not found). Cached per request. */
export const find_demo = cache(async (slug: string): Promise<Plain<PrivateDemo> | null> => {
    if (typeof slug != "string" || slug.length > 60) return null;
    const doc = await (await private_demos_collection()).findOne({ slug, enabled: true }, { projection: { _id: 0 } });
    return doc ? plain(doc) : null;
});

/** The enabled demo whose name is this ?ref=, if any. Cached per request. */
export const demo_by_ref = cache(async (ref: string): Promise<Plain<PrivateDemo> | null> => {
    const doc = await (await private_demos_collection()).findOne({ name: ref, enabled: true }, { projection: { _id: 0 } });
    return doc ? plain(doc) : null;
});

/** Whether this ?ref= is a private demo: its visitor sees only the seller's pieces, never the store's own stock. */
export async function is_demo_ref(ref: string | undefined): Promise<boolean> {
    return Boolean(ref && (await demo_by_ref(ref)));
}

export async function get_demo(id: string): Promise<Plain<PrivateDemo> | null> {
    const doc = await (await private_demos_collection()).findOne({ id }, { projection: { _id: 0 } });
    return doc ? plain(doc) : null;
}

export async function list_demos(): Promise<Plain<PrivateDemo>[]> {
    return plain(await (await private_demos_collection()).find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray());
}

/** The storefront product slug of a piece. */
export function demo_item_slug(demo_slug: string, piece_id: string): string {
    return `${demo_slug}-${piece_id}`;
}

/**
 * A piece as a storefront product. Only what the admin entered is filled in; everything else is
 * left unknown, so the store shows nothing for it rather than a made-up detail.
 */
function demo_item(demo: { id: string; slug: string; name: string; category: PrivateDemo["category"]; enabled: boolean }, piece: DemoPiece) {
    const type = piece_kind(demo.category, piece);
    const d = piece.details ?? {};
    const common = {
        slug: demo_item_slug(demo.slug, piece.id),
        display_name: piece.title,
        price: piece.price,
        currency: "EUR",
        condition: d.condition ?? UNVERIFIED,
        gender: d.gender ?? UNVERIFIED,
        images: piece.photos.map(demo_photo_url),
        description: piece.description,
        featured: false,
        type,
        preview: demo.name,
        private_demo: demo.id,
        ...(piece.collection ? { collection: piece.collection } : {}),
        deleted: !demo.enabled,
        updated_at: new Date(),
    };

    if (type == "watch") {
        const brand = piece.brand?.trim().toLowerCase() ?? "";
        const model = brand && piece.title.toLowerCase().startsWith(`${brand} `) ? piece.title.slice(brand.length + 1) : piece.title;
        return {
            ...common,
            brand,
            brandSlug: brand.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            model,
            reference: d.reference ?? "",
            year: d.year ?? 0,
            movement: d.movement ?? UNVERIFIED,
            caseMaterial: d.caseMaterial ?? UNVERIFIED,
            caseDiameterMm: d.caseDiameterMm ?? 0,
            braceletMaterial: d.braceletMaterial ?? UNVERIFIED,
            dialColor: d.dialColor ?? UNVERIFIED,
            waterResistanceM: d.waterResistanceM ?? 0,
            boxPapers: { box: d.box ?? false, papers: d.papers ?? false, firstInvoice: false, serviceInvoice: false },
        };
    }
    const jewelry = { ...common, weight: d.weight_g ?? 0, measurement_unit: "grams", metal_type: d.metal_type ?? "", karats: d.karats ?? 0, stones: d.stones ?? [] };
    return type == "ring" ? { ...jewelry, ring_size: d.ring_size ?? "" } : { ...jewelry, length: d.length_cm ?? 0, length_unit: "cm" };
}

/** Writes the demo's pieces as storefront products and removes products of pieces taken out. Returns their slugs. */
async function sync_items(demo: Parameters<typeof demo_item>[0], pieces: DemoPiece[]): Promise<string[]> {
    // Untyped: one demo product has the fields of whichever product type the piece is.
    const items = (await db()).collection("items");
    const slugs = pieces.map((p) => demo_item_slug(demo.slug, p.id));

    // Newest first in "New Arrivals": insert the last piece first, so the first piece is the newest.
    for (const piece of [...pieces].reverse()) {
        const item = demo_item(demo, piece);
        await items.updateOne(
            { slug: item.slug },
            { $set: item, $setOnInsert: { date_added: new Date(), relevance_score: 0, quantity: 1, status: "available", inStock: true, reservations: [] } },
            { upsert: true },
        );
    }
    // Also catches products left behind when the demo's address (and so the slugs) changed.
    await items.deleteMany({ private_demo: demo.id, slug: { $nin: slugs } });
    return slugs;
}

export type SaveDemoResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

/**
 * Create (unknown id) or update a demo and its storefront products. The store's caches are not
 * refreshed here (this also runs from the CLI script): the demo is marked `stale` and
 * refresh_demo() clears it, from the admin right away or on the next visit to the demo's link.
 */
export async function save_demo(id: string, input: unknown): Promise<SaveDemoResult> {
    if (typeof id != "string" || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, error: "Invalid demo." };

    const parsed = demo_schema.safeParse(input);
    if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
        return { ok: false, error: "Please fix the highlighted fields.", fields };
    }
    const data = parsed.data;
    const demos = await private_demos_collection();
    const photos = await private_demo_photos_collection();
    const invalid = (fields: Record<string, string>): SaveDemoResult => ({ ok: false, error: "Please fix the highlighted fields.", fields });

    if (await demos.findOne({ slug: data.slug, id: { $ne: id } }, { projection: { _id: 1 } })) return invalid({ slug: "Another demo already uses this address." });
    // The name is the visitor's ref, which picks the products: two demos must never share one.
    if (await demos.findOne({ name: { $regex: `^${escape_regex(data.name)}$`, $options: "i" }, id: { $ne: id } }, { projection: { _id: 1 } })) return invalid({ name: "Another demo already uses this name." });
    const taken = await (await items_collection()).findOne({ slug: { $in: data.pieces.map((p) => demo_item_slug(data.slug, p.id)) }, private_demo: { $ne: id } }, { projection: { slug: 1 } });
    if (taken) return invalid({ slug: `A store product already uses the address ${taken.slug}. Pick another demo address.` });

    // Only this demo's own photos may appear in it: never another seller's.
    const used = data.pieces.flatMap((p) => p.photos);
    const owned = await photos.countDocuments({ _id: { $in: used }, demo_id: id });
    if (owned != new Set(used).size) return { ok: false, error: "Some photos could not be found. Upload them again." };

    const now = new Date();
    const { instagram, ...fields } = data;
    let enabled = true;
    try {
        const saved = await demos.findOneAndUpdate(
            { id },
            {
                $set: { ...fields, ...(instagram ? { instagram } : {}), stale: true, updated_at: now },
                // An Instagram handle left empty is removed rather than stored as null.
                ...(instagram ? {} : { $unset: { instagram: "" } }),
                $setOnInsert: { enabled: true, views: 0, created_at: now },
            },
            { upsert: true, returnDocument: "after", projection: { enabled: 1 } },
        );
        enabled = saved?.enabled ?? true;
    } catch (error) {
        if (error instanceof MongoServerError && error.code == 11000) return invalid({ slug: "Another demo already uses this address." });
        throw error;
    }

    await sync_items({ id, slug: data.slug, name: data.name, category: data.category, enabled }, data.pieces);

    // Photos removed in the form, and uploads for demos that were never saved.
    await photos.deleteMany({ demo_id: id, _id: { $nin: used } });
    // Not distinct(): the client uses the strict Stable API (app/db/client.ts), which does not allow it.
    const saved_ids = (await demos.find({}, { projection: { _id: 0, id: 1 } }).toArray()).map((d) => d.id);
    await photos.deleteMany({ demo_id: { $nin: saved_ids }, created_at: { $lt: new Date(Date.now() - ORPHAN_MS) } });

    return { ok: true };
}

/** The storefront product slugs of a demo (for refreshing the store's caches). */
export async function demo_item_slugs(id: string): Promise<string[]> {
    return (await (await items_collection()).find({ private_demo: id }, { projection: { _id: 0, slug: 1 } }).toArray()).map((i) => i.slug);
}

/** Marks the demo's products as shown in the store's caches (call after refreshing them). */
export async function mark_demo_fresh(id: string): Promise<void> {
    await (await private_demos_collection()).updateOne({ id }, { $unset: { stale: "" } });
}

/** Disabling hides the demo's products from the store as well as its link. */
export async function set_demo_enabled(id: string, enabled: boolean): Promise<boolean> {
    const result = await (await private_demos_collection()).updateOne({ id }, { $set: { enabled, updated_at: new Date() } });
    await (await items_collection()).updateMany({ private_demo: id }, { $set: { deleted: !enabled, updated_at: new Date() } });
    return result.matchedCount == 1;
}

/** Permanently removes the demo, its products, its photos and the enquiries it received. Returns the removed product slugs. */
export async function delete_demo(id: string): Promise<{ deleted: boolean; slugs: string[] }> {
    const slugs = await demo_item_slugs(id);
    const result = await (await private_demos_collection()).deleteOne({ id });
    await (await items_collection()).deleteMany({ private_demo: id });
    await (await private_demo_photos_collection()).deleteMany({ demo_id: id });
    await (await enquiries_collection()).deleteMany({ "demo.id": id });
    return { deleted: result.deletedCount == 1, slugs };
}

export async function save_demo_photo(demo_id: string, type: string, bytes: Uint8Array): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    if (!/^[0-9a-f-]{36}$/.test(demo_id)) return { ok: false, error: "Invalid demo." };
    if (!PHOTO_TYPES.includes(type)) return { ok: false, error: "Use a JPG, PNG or WebP photo." };
    if (bytes.byteLength == 0 || bytes.byteLength > MAX_PHOTO_BYTES) return { ok: false, error: "This photo is too large." };

    const photos = await private_demo_photos_collection();
    if ((await photos.countDocuments({ demo_id })) >= MAX_PHOTOS_PER_DEMO) return { ok: false, error: "Too many photos for this demo." };

    const photo: PrivateDemoPhoto = { _id: randomUUID(), demo_id, content_type: type, size: bytes.byteLength, data: new Binary(bytes), created_at: new Date() };
    await photos.insertOne(photo);
    return { ok: true, id: photo._id };
}

/** The photo and whether its demo is live (photos of disabled or deleted demos are not public). */
export async function read_demo_photo(id: string): Promise<{ photo: PrivateDemoPhoto; live: boolean } | null> {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const photo = await (await private_demo_photos_collection()).findOne({ _id: id });
    if (!photo) return null;
    const live = (await (await private_demos_collection()).countDocuments({ id: photo.demo_id, enabled: true })) > 0;
    return { photo, live };
}

/** Link previews, crawlers and scripts. Instagram's in-app browser ("Instagram 3xx…") is a person and is counted. */
const NOT_A_PERSON = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-external|WhatsApp|Twitterbot|Slackbot|Discordbot|TelegramBot|LinkedInBot|SkypeUriPreview|Iframely|embedly|preview|HeadlessChrome|Lighthouse|curl\/|Wget|python|node-fetch|undici|axios|Go-http-client|okhttp|Java\//i;

/** Whether a request is a person: not a link preview, crawler or script. */
export function is_person(headers: { get(name: string): string | null }): boolean {
    const agent = headers.get("user-agent") ?? "";
    return Boolean(agent) && !NOT_A_PERSON.test(agent);
}

/** Whether a request is a person opening a demo's link: not the admin, a bot or a prefetch. */
export function is_counted_visit(headers: { get(name: string): string | null }, is_admin: boolean): boolean {
    if (is_admin || !is_person(headers)) return false;
    if (headers.get("rsc") || headers.get("next-router-prefetch") || /prefetch|prerender/i.test(`${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`)) return false;
    const dest = headers.get("sec-fetch-dest");
    return !dest || dest == "document";
}

/** Counts one visit; the first one also sets first_opened_at. No visitor data is stored. */
export async function record_demo_view(id: string): Promise<void> {
    const now = new Date();
    await (await private_demos_collection()).updateOne({ id }, { $inc: { views: 1 }, $min: { first_opened_at: now }, $set: { last_opened_at: now } });
}
