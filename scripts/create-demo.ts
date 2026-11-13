/**
 * Create or update a private demo (corlane.store/<slug>) from a JSON file and a folder of photos,
 * through the same code the admin uses (app/server/private_demos.ts). Safe to run again: the demo is
 * found by its address and updated, and photos it no longer uses are deleted.
 *
 *   npx tsx --conditions=react-server scripts/create-demo.ts "temp data/hdjl.json"
 *
 * Uses MONGO_URI from the environment or .env. Anything other than a local database (localhost /
 * 127.0.0.1) is refused unless --production is added, so production is only changed on purpose.
 *
 * The JSON: { slug, name, instagram?, category, language, currency, pieces: [{ id, kind?, brand?, details?, title,
 * description, price (EUR), photos: ["folder/file.jpg", …] }] }, photo paths relative to the JSON file.
 * Each piece becomes a storefront product shown only to visitors of the demo's link.
 *
 * A lead demo config (demos/<slug>.json, shown at /<locale>/<slug>) can be passed as it is: its
 * pieces become the demo's products (photo paths are under public/), so the store's cart, checkout,
 * enquiries and accounts work in it.
 *   npx tsx --conditions=react-server scripts/create-demo.ts demos/galeria.json
 * The originals are never changed: each photo is re-encoded in memory as a JPEG (no metadata).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { localize_config, type DemoStoreConfig, type DemoStoreSource } from "../app/[local]/(site)/lib/storefront";
import { collected_data_collection } from "@/app/db/collections";
import { PrivateDemoData } from "@/types/private_demo";

const [spec_path] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const production = process.argv.includes("--production");

if (!spec_path) {
    console.error("Usage: npx tsx --conditions=react-server scripts/create-demo.ts <demo.json> [--production]");
    process.exit(1);
}
const host = (process.env.MONGO_URI ?? "").replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?/, "").split(/[/?,]/)[0];
if (!host) {
    console.error("MONGO_URI is not set (add it to .env).");
    process.exit(1);
}
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
if (!local && !production) {
    console.error(`MONGO_URI points to ${host}, not a local database. Add --production to change that database on purpose.`);
    process.exit(1);
}

type PieceSpec = { id: string; kind?: string; brand?: string; title: string; description: string; price: number; details?: Record<string, unknown>; collection?: string; photos: string[] };
type DemoSpec = { slug: string; name: string; instagram?: string; category: string; language: string; currency: string; pieces: PieceSpec[] };

const raw = JSON.parse(readFileSync(spec_path, "utf8"));
// A lead demo config: its photos are site paths (/demos/<slug>/…), under public/.
const is_lead = "locale" in raw;
const spec: DemoSpec = is_lead ? from_lead(localize_config(raw as DemoStoreSource, (raw as DemoStoreSource).locale)) : raw;
// A lead config's photos: site paths (under public/) and import-only paths from the project root.
const folder = is_lead ? process.cwd() : path.dirname(path.resolve(spec_path));

/** The products are written in the demo's own language; the store shows the config's other languages over them. */
function from_lead(lead: DemoStoreConfig): DemoSpec {
    const title_case = (brand: string) => (brand.toLowerCase() == "iwc" ? "IWC" : brand.charAt(0).toUpperCase() + brand.slice(1));
    return {
        slug: lead.slug,
        name: lead.name,
        instagram: lead.instagram,
        category: "watches",
        language: lead.locale,
        currency: "EUR",
        pieces: lead.pieces.map((p) => {
            if (!p.price) throw new Error(`${p.slug}: a price is needed for a store product`);
            return {
                id: p.slug,
                brand: p.brand,
                title: `${title_case(p.brand)} ${p.model}`,
                description: p.description,
                price: p.price,
                ...(p.collection ? { collection: p.collection } : {}),
                ...(p.details || p.dial ? { details: { ...p.details, ...(p.dial ? { dialColor: p.dial } : {}) } } : {}),
                photos: [...p.images.map((src) => path.join("public", src)), ...(p.import_photos ?? [])].slice(0, 8),
            };
        }),
    };
}

// Imported after dotenv so the database client sees MONGO_URI.
const { list_demos, read_demo_photo, save_demo, save_demo_photo } = await import("../app/server/private_demos");

console.log(`Database: ${host}${local ? " (local)" : " (PRODUCTION)"}`);
const existing = (await list_demos()).find((d) => d.slug == spec.slug.trim().toLowerCase());
const id = existing?.id ?? randomUUID();
console.log(existing ? `Updating demo ${spec.slug} (${id})` : `Creating demo ${spec.slug} (${id})`);

const pieces = [];
for (const piece of spec.pieces) {
    const photos: string[] = [];
    for (const file of piece.photos) {
        const bytes = await sharp(path.join(folder, file)).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
        const saved = await save_demo_photo(id, "image/jpeg", new Uint8Array(bytes));
        if (!saved.ok) throw new Error(`${file}: ${saved.error}`);
        photos.push(saved.id);
    }
    pieces.push({ ...piece, photos });
    console.log(`  ${piece.id}: ${piece.title} (${photos.length} photos)`);
}

const result = await save_demo(id, { ...spec, pieces });
if (!result.ok) {
    console.error("Not saved:", result.error, result.fields ?? "");
    process.exit(1);
}

// Every piece must have photos that are actually served.
for (const piece of pieces) {
    for (const photo of piece.photos) {
        const found = await read_demo_photo(photo);
        if (!found || found.photo.size == 0) throw new Error(`Photo ${photo} of ${piece.id} is missing`);
    }
}
console.log(
    `Saved. ${pieces.length} pieces, ${pieces.reduce((n, p) => n + p.photos.length, 0)} photos, all readable. Live at /${spec.slug}${existing && !existing.enabled ? " once you enable it in the admin" : ""}; the store shows the changes from the next visit to that link.`,
);

//creating visitor data
const data: PrivateDemoData = {
    name: spec_path.replace(".json", ""),
    pieces: pieces.length,
    link: `https://corlane.store/${spec_path.replace(".json", "")}`,
    date: new Date(),
    visited: false,
    visits: [],
};

const col = await collected_data_collection();

if (await col.findOne({ name: data.name })) {
    await col.insertOne(data);
    console.log("created visitor data");
} else console.log("visitor data already exists skipped tracking part");

process.exit(0);
