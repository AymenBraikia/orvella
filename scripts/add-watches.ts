/**
 * Add the demo's watch catalogue. Previews by default; nothing is written without --apply.
 *
 *   npm run add-watches            (check the data, show what would change)
 *   npm run add-watches -- --apply (write it)
 *
 * Safe to run again: a slug that already exists is skipped, so edits made in the admin stay.
 * Reference, year and box & papers are left empty on purpose. These photos are illustrations, not
 * photographed stock, so there is nothing true to put there. Demo use only, never a dealer's shop.
 * The media in /public/uploads/watches must be deployed before --apply, or the images show broken.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";

const DB_NAME = "orvella"; // same as app/db/collections.ts

// The same rules as the admin product form. Node needs the .ts extension here, TypeScript refuses it.
const { product_schema } = await import("../app/[local]/(admin)/admin/products/schema.ts" as string);

type Spec = {
    slug: string;
    brand: string;
    model: string;
    price: number;
    case_material: string;
    bracelet: string;
    dial: string;
    diameter: number;
    water_resistance: number;
    images: number;
    description: string;
};

const WATCHES: Spec[] = [
    {
        slug: "audemars-piguet-royal-oak-chronograph-full-pave-rose-gold",
        brand: "audemars piguet",
        model: "Royal Oak Chronograph Full Pavé",
        price: 185000,
        case_material: "Rose Gold",
        bracelet: "Rose Gold",
        dial: "Diamond Pavé",
        diameter: 41,
        water_resistance: 50,
        images: 5,
        description: "Audemars Piguet Royal Oak Chronograph in rose gold, with diamonds set across the case, bezel, dial and bracelet. Rose gold chronograph counters and date at 4:30.",
    },
    {
        slug: "audemars-piguet-royal-oak-selfwinding-rose-gold-blue",
        brand: "audemars piguet",
        model: "Royal Oak Selfwinding",
        price: 62000,
        case_material: "Rose Gold",
        bracelet: "Rose Gold",
        dial: "Blue",
        diameter: 41,
        water_resistance: 50,
        images: 3,
        description: "Audemars Piguet Royal Oak Selfwinding in rose gold, with a blue Tapisserie dial, applied rose gold hour markers and date at 3 o'clock.",
    },
    {
        slug: "audemars-piguet-royal-oak-chronograph-frosted-white-gold",
        brand: "audemars piguet",
        model: "Royal Oak Chronograph Frosted Gold",
        price: 78000,
        case_material: "White Gold",
        bracelet: "White Gold",
        dial: "Grey",
        diameter: 41,
        water_resistance: 50,
        images: 5,
        description: "Audemars Piguet Royal Oak Chronograph in frosted white gold, with a grey Tapisserie dial, silver-toned counters and date at 4:30.",
    },
    {
        slug: "rolex-daytona-turquoise-baguette-yellow-gold",
        brand: "rolex",
        model: "Daytona Turquoise Baguette",
        price: 145000,
        case_material: "Yellow Gold",
        bracelet: "Leather",
        dial: "Turquoise",
        diameter: 40,
        water_resistance: 100,
        images: 4,
        description: "Rolex Daytona in yellow gold, with a turquoise dial, gold Roman numerals, a bezel set with blue baguette stones and a turquoise leather strap.",
    },
    {
        slug: "rolex-daytona-diamond-bezel-yellow-gold-champagne",
        brand: "rolex",
        model: "Daytona Diamond Bezel",
        price: 120000,
        case_material: "Yellow Gold",
        bracelet: "Yellow Gold",
        dial: "Champagne",
        diameter: 40,
        water_resistance: 100,
        images: 4,
        description: "Rolex Daytona in yellow gold, with a champagne dial, a baguette diamond bezel and diamond-set lugs on a yellow gold bracelet.",
    },
    {
        slug: "rolex-day-date-40-diamond-bezel-rose-gold",
        brand: "rolex",
        model: "Day-Date 40 Diamond Bezel",
        price: 72000,
        case_material: "Rose Gold",
        bracelet: "Rose Gold",
        dial: "Brown Stone",
        diameter: 40,
        water_resistance: 100,
        images: 3,
        description: "Rolex Day-Date 40 in rose gold, with a brown stone dial, diamond hour markers and a diamond bezel on a rose gold President bracelet.",
    },
    {
        slug: "rolex-day-date-40-green-yellow-gold",
        brand: "rolex",
        model: "Day-Date 40 Green",
        price: 48000,
        case_material: "Yellow Gold",
        bracelet: "Yellow Gold",
        dial: "Green",
        diameter: 40,
        water_resistance: 100,
        images: 4,
        description: "Rolex Day-Date 40 in yellow gold, with a green gradient dial, Roman numerals and a fluted bezel on a yellow gold President bracelet.",
    },
    {
        slug: "grand-seiko-heritage-spring-drive-blue",
        brand: "grand seiko",
        model: "Heritage Spring Drive Blue",
        price: 6900,
        case_material: "Stainless Steel",
        bracelet: "Stainless Steel",
        dial: "Blue",
        diameter: 40,
        water_resistance: 100,
        images: 4,
        description: "Grand Seiko Heritage Spring Drive in stainless steel, with a textured blue dial, power reserve indicator and date at 3 o'clock.",
    },
    {
        slug: "grand-seiko-hi-beat-36000-gmt-red",
        brand: "grand seiko",
        model: "Hi-Beat 36000 GMT Red",
        price: 8900,
        case_material: "Stainless Steel",
        bracelet: "Stainless Steel",
        dial: "Red",
        diameter: 40,
        water_resistance: 100,
        images: 5,
        description: "Grand Seiko Hi-Beat 36000 GMT in stainless steel, with a textured red dial, gold GMT hand and date at 3 o'clock.",
    },
    {
        slug: "patek-philippe-nautilus-blue-steel",
        brand: "patek philippe",
        model: "Nautilus Blue",
        price: 115000,
        case_material: "Stainless Steel",
        bracelet: "Stainless Steel",
        dial: "Blue",
        diameter: 40,
        water_resistance: 120,
        images: 7,
        description: "Patek Philippe Nautilus in stainless steel, with a blue gradient horizontally embossed dial and date at 3 o'clock on an integrated steel bracelet.",
    },
    {
        slug: "patek-philippe-nautilus-chronograph-baguette-rose-gold",
        brand: "patek philippe",
        model: "Nautilus Chronograph Baguette",
        price: 290000,
        case_material: "Rose Gold",
        bracelet: "Rose Gold",
        dial: "Grey",
        diameter: 40.5,
        water_resistance: 120,
        images: 4,
        description: "Patek Philippe Nautilus Chronograph in rose gold, with a baguette diamond bezel, a diamond-set bracelet and a grey gradient dial.",
    },
];

const media_dir = (slug: string) => `/uploads/watches/${slug}`;

function to_document(w: Spec) {
    const dir = media_dir(w.slug);
    return {
        type: "watch" as const,
        slug: w.slug,
        brand: w.brand,
        brandSlug: w.brand.replace(/\s+/g, "-"),
        model: w.model,
        display_name: `${w.brand} ${w.model}`,
        reference: "",
        year: 0,
        price: w.price,
        condition: "New" as const,
        gender: "Men" as const,
        movement: "Automatic" as const,
        caseMaterial: w.case_material,
        caseDiameterMm: w.diameter,
        braceletMaterial: w.bracelet,
        dialColor: w.dial,
        waterResistanceM: w.water_resistance,
        boxPapers: { box: false, papers: false, firstInvoice: false, serviceInvoice: false },
        images: Array.from({ length: w.images }, (_, i) => `${dir}/img_${i}.jpg`),
        video: `${dir}/video.mp4`,
        description: w.description,
        featured: false,
        quantity: 1,
    };
}

const apply = process.argv.includes("--apply");

const documents = WATCHES.map(to_document);

let problems = 0;
for (const doc of documents) {
    const parsed = product_schema.safeParse(doc);
    const missing = [...doc.images, doc.video].filter((url) => !existsSync(`public${url}`));

    if (!parsed.success || missing.length) {
        problems++;
        console.error(`${doc.slug}:`, parsed.success ? "" : parsed.error.issues.map((i: { path: string[]; message: string }) => `${i.path.join(".")} ${i.message}`), missing);
    }
}
if (problems) {
    console.error(`${problems} watch(es) failed the checks. Nothing was written.`);
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (add it to .env).");
    process.exit(1);
}

const client = new MongoClient(process.env.MONGO_URI);

try {
    await client.connect();
    const items = client.db(DB_NAME).collection("items");

    const existing = new Set((await items.find({ slug: { $in: documents.map((d) => d.slug) } }, { projection: { slug: 1 } }).toArray()).map((i) => i.slug));
    const fresh = documents.filter((d) => !existing.has(d.slug));

    for (const doc of documents) console.log(`${existing.has(doc.slug) ? "exists, skip" : apply ? "add" : "would add"}  €${doc.price}  ${doc.display_name}  (${doc.images.length} photos)`);

    if (apply && fresh.length) {
        const now = new Date();
        await items.insertMany(fresh.map((doc) => ({ ...doc, currency: "EUR", date_added: now, updated_at: now, relevance_score: 0, reservations: [], inStock: true, status: "available" })));
    }

    console.log(apply ? `Added ${fresh.length}, skipped ${existing.size}.` : `Preview only: ${fresh.length} would be added. Run with --apply to write them.`);
} finally {
    await client.close();
}
