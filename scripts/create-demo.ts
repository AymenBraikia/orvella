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
 * The originals are never changed: each photo is re-encoded in memory as a JPEG (no metadata).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const [spec_path] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const production = process.argv.includes("--production");

if (!spec_path) {
    console.error('Usage: npx tsx --conditions=react-server scripts/create-demo.ts <demo.json> [--production]');
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

type PieceSpec = { id: string; kind?: string; brand?: string; title: string; description: string; price: number; details?: Record<string, unknown>; photos: string[] };
type DemoSpec = { slug: string; name: string; instagram?: string; category: string; language: string; currency: string; pieces: PieceSpec[] };

const spec: DemoSpec = JSON.parse(readFileSync(spec_path, "utf8"));
const folder = path.dirname(path.resolve(spec_path));

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
console.log(`Saved. ${pieces.length} pieces, ${pieces.reduce((n, p) => n + p.photos.length, 0)} photos, all readable. Live at /${spec.slug}${existing && !existing.enabled ? " once you enable it in the admin" : ""}; the store shows the changes from the next visit to that link.`);
process.exit(0);
