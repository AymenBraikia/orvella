/**
 * Builds a lead demo (demos/<slug>.json + public/demos/<slug>/) from a folder of the seller's
 * material, like the Galeria demo. Then import its watches as store products:
 *   npx tsx scripts/build-lead-demo.ts "star watch" --name "Star Watches"
 *   npx tsx --conditions=react-server scripts/create-demo.ts demos/star-watches.json [--production]
 *
 * The folder:
 *   logo.(png|jpg)                       required. A plain white background is made transparent.
 *   logo_no_text.(png|jpg)               optional: the icon (phones' header). Else the logo.
 *   logo_horizontal.(png|jpg)            optional: the footer. Else the icon.
 *   favicon.ico                          optional. Else made from the icon.
 *   hero_vid.mp4                         optional: the phones' hero video, copied as it is (trim and
 *                                        compress it first; the hero falls back to photos).
 *   <n>/*.jpg + <n>/caption.txt          one folder per watch: its photos and its Instagram caption.
 *
 * Options: --name "Store Name" (default: the folder name), --slug, --locale en, --instagram handle,
 * --rate INR=98 (units of a currency per euro; prices are stored in EUR), --photos 6 (per watch),
 * --hero <watch folder> (its first photo for the hero; default: the darkest first photo).
 *
 * Captions are read by scripts/lead_demo/caption.ts. Anything a caption does not give is filled with
 * a realistic default (movement, bracelet, water resistance…), and a watch without a price keeps the
 * one already in the config (edit it there): the report at the end lists what to check. The
 * originals are never changed; photos other than each watch's first go to <folder>/.web/ (used by
 * the import only, so the site and the repository stay small).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { parse_caption, sentence_case, type Collection, type Currency, type ParsedCaption } from "./lead_demo/caption";
import { brand_name } from "../app/[local]/(site)/lib/brand_name";
import type { DemoStorePiece, DemoStoreSource } from "../app/[local]/(site)/lib/storefront";

// ---- arguments ------------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
};
const folder = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!folder || !existsSync(folder)) {
    console.error('Usage: npx tsx scripts/build-lead-demo.ts "<folder>" [--name "Store Name"] [--slug slug] [--locale en] [--instagram handle] [--rate INR=98] [--photos 6]');
    process.exit(1);
}
const name = (flag("name") ?? path.basename(folder).replace(/[-_]+/g, " ")).trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const slug = flag("slug") ?? name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const locale = (flag("locale") ?? "en") as DemoStoreSource["locale"];
const photos_per_watch = Math.min(8, Number(flag("photos") ?? 6));
/** Units of each currency per euro (store prices are EUR). Override with --rate INR=97. */
const RATES: Record<Currency, number> = { EUR: 1, INR: 98, USD: 1.08, GBP: 0.85, TRY: 38, AED: 3.97 };
for (const r of args.filter((_, i) => args[i - 1] == "--rate")) {
    const [cur, value] = r.split("=");
    if (cur in RATES && Number(value) > 0) RATES[cur as Currency] = Number(value);
}

const OUT = path.join("public", "demos", slug);
const WEB = path.join(folder, ".web");
const site = (file: string) => `/demos/${slug}/${file}`;
mkdirSync(OUT, { recursive: true });
mkdirSync(WEB, { recursive: true });

const report: string[] = [];
const note = (line: string) => report.push(line);

// ---- the watches ----------------------------------------------------------------------------

const COLLECTION_NAMES: Record<Collection, string> = { diver: "Diver", gmt: "GMT", chronograph: "Chronograph", classic: "Classic", sport: "Sport" };
/** Families named with their case size, like the catalogue ("Datejust 41"). */
const SIZED = /^(Datejust|Day-Date|Yacht-Master|Oyster Perpetual|Constellation)$/;
const PROPER = ["Rolex", "Omega", "Panerai", "Cartier", "Tudor", "IWC", "Hublot", "Breitling", "Patek Philippe", "Audemars Piguet", "Cerachrom", "Rolesor", "Everose", "Oyster", "Jubilee", "Oysterflex", "Luminor", "Marina", "Submariner", "Daytona", "Datejust", "GMT-Master II", "Sky-Dweller", "Yacht-Master", "Constellation", "Co-Axial", "Tank"];

const previous: DemoStoreSource | null = existsSync(`demos/${slug}.json`) ? JSON.parse(readFileSync(`demos/${slug}.json`, "utf8")) : null;

type Built = { piece: DemoStorePiece<string>; caption: ParsedCaption; dir: string; first_photo: string };
const dirs = readdirSync(folder, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

const captions = dirs.map((d) => (existsSync(path.join(folder, d, "caption.txt")) ? parse_caption(readFileSync(path.join(folder, d, "caption.txt"), "utf8")) : null));
const most_common = (values: (string | undefined)[]) => Object.entries(values.filter(Boolean).reduce<Record<string, number>>((n, v) => ({ ...n, [v!]: (n[v!] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]?.[0];
const city = most_common(captions.map((c) => c?.city));
const whatsapp = most_common(captions.map((c) => c?.whatsapp));

const used_slugs = new Set<string>();
const built: Built[] = [];

for (const [i, dir] of dirs.entries()) {
    const caption = captions[i];
    const photos = readdirSync(path.join(folder, dir))
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
    if (!caption || !caption.brand || !photos.length) {
        note(`✗ ${dir}: skipped (${!photos.length ? "no photos" : !caption ? "no caption.txt" : "no known brand in the caption"})`);
        continue;
    }

    const brand = caption.brand;
    const family = caption.family ?? "Watch";
    const model = [family, SIZED.test(family) && caption.size_mm ? caption.size_mm : "", caption.nickname ? `“${caption.nickname}”` : ""].filter(Boolean).join(" ");
    const collection = caption.collection ?? "classic";

    let piece_slug = [brand, family, caption.reference ?? dir].join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    while (used_slugs.has(piece_slug)) piece_slug += `-${dir}`;
    used_slugs.add(piece_slug);

    // A watch corrected by hand in the config ("locked": true) is kept as it is.
    const locked = previous?.pieces.find((p) => p.slug == piece_slug && p.locked);
    if (locked) {
        built.push({ dir, caption, first_photo: path.join(folder, dir, photos[0]), piece: locked as DemoStorePiece<string> });
        note(`✓ ${dir.padStart(2)} ${brand_name(brand)} ${locked.model}: locked, kept from the config`);
        continue;
    }

    // Realistic defaults for what the caption does not say.
    const guessed: string[] = [];
    const guess = <T,>(value: T | undefined, fallback: T, label: string): T => {
        if (value !== undefined) return value;
        guessed.push(label);
        return fallback;
    };
    const diver = collection == "diver";
    const strap = /^(panerai|cartier|iwc)$/.test(brand) || /Calatrava|Tank|Luminor|Radiomir|Portugieser/.test(family);
    const details: Record<string, string | number | boolean> = {
        ...(caption.reference ? { reference: caption.reference } : {}),
        ...(caption.year ? { year: caption.year } : {}),
        movement: guess(caption.movement, "Automatic", "movement"),
        caseMaterial: guess(caption.material, brand == "rolex" ? "Oystersteel" : "Stainless Steel", "case material"),
        ...(caption.size_mm ? { caseDiameterMm: caption.size_mm } : {}),
        braceletMaterial: guess(caption.bracelet, brand == "rolex" ? "Oyster bracelet" : strap ? "Leather strap" : "Steel bracelet", "bracelet"),
        waterResistanceM: diver ? 300 : brand == "cartier" ? 30 : brand == "rolex" ? 100 : 50,
        condition: caption.is_new ? "New" : "Pre-Owned",
        gender: caption.size_mm && caption.size_mm <= 34 ? "Women" : "Men",
        box: caption.box,
        papers: caption.papers,
    };
    guessed.push("water resistance");

    // Price in EUR: the caption's price, else a little under its retail price, else the config's.
    const kept = previous?.pieces.find((p) => p.slug == piece_slug)?.price;
    let price: number | undefined;
    let price_note: string;
    const eur = (p: { amount: number; currency: Currency }) => Math.round(p.amount / RATES[p.currency] / 50) * 50;
    if (caption.price) {
        price = eur(caption.price);
        price_note = `price from the caption (${caption.price.amount.toLocaleString("en-IN")} ${caption.price.currency})`;
    } else if (kept) {
        price = kept;
        price_note = "price kept from the config";
    } else if (caption.retail) {
        price = Math.round((eur(caption.retail) * 0.92) / 50) * 50;
        price_note = `price ESTIMATED at 92% of retail (${caption.retail.amount.toLocaleString("en-IN")} ${caption.retail.currency})`;
    } else {
        price_note = "NO PRICE: add one to the config (or it shows \"price on request\" and cannot be bought)";
    }

    // Description: the caption's own sentences, then condition, scope of delivery and extras.
    const proper = [brand_name(brand), ...PROPER, ...(caption.nickname ? [caption.nickname] : [])];
    const lead =
        caption.sentences.map((s) => sentence_case(s, proper).replace(/[.!]*$/, ".")).join(" ") ||
        `${brand_name(brand)} ${family}${caption.size_mm ? ` ${caption.size_mm} mm` : ""}${caption.material ? ` in ${caption.material.toLowerCase().replace(/(\d+k)/, "$1")}` : ""}${caption.dial ? ` with a ${caption.dial.toLowerCase()} dial` : ""}${caption.year ? `, ${caption.year}` : ""}.`;
    const scope = caption.box && caption.papers ? "Full set with box and warranty card." : caption.box ? "Comes with the box." : "Watch only.";
    const condition = caption.condition_score ? `Condition ${caption.condition_score}/10${caption.condition_note ? ` (${caption.condition_note})` : ""}.` : caption.is_new ? "Unworn." : "";
    const extras = caption.extras.length ? `With ${caption.extras.join(", ")}.` : "";
    const description = [lead, scope, condition, extras].filter(Boolean).join(" ").replace(/\s+/g, " ");

    // Photos: the first one is the site's (cards, brand and collection tiles); the others are the import's.
    const square = (src: string, out: string) => sharp(src).rotate().resize(1200, 1200, { fit: "cover", position: "centre", withoutEnlargement: true }).withIccProfile("srgb").jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(out);
    const first = `watch-${dir}.jpg`;
    await square(path.join(folder, dir, photos[0]), path.join(OUT, first));
    const import_photos: string[] = [];
    for (const [j, photo] of photos.slice(1, photos_per_watch).entries()) {
        const out = path.join(WEB, `${dir}-${j + 2}.jpg`);
        await square(path.join(folder, dir, photo), out);
        import_photos.push(out.replace(/\\/g, "/"));
    }

    built.push({
        dir,
        caption,
        first_photo: path.join(folder, dir, photos[0]),
        piece: {
            slug: piece_slug,
            brand,
            model,
            ...(price ? { price } : {}),
            description,
            images: [site(first)],
            ...(import_photos.length ? { import_photos } : {}),
            collection,
            ...(caption.dial ? { dial: caption.dial } : {}),
            details,
        },
    });
    note(`✓ ${dir.padStart(2)} ${brand_name(brand)} ${model}${caption.reference ? ` (${caption.reference})` : ""}: ${price_note}${guessed.length ? `; guessed ${guessed.join(", ")}` : ""}`);
}

if (!built.length) {
    console.error("No watches found (each needs a folder with photos and a caption naming a known brand).");
    process.exit(1);
}

// ---- logo, icon, favicon, accent --------------------------------------------------------------

const find = (base: string) => ["png", "jpg", "jpeg", "webp"].map((e) => path.join(folder, `${base}.${e}`)).find(existsSync);

/** The logo with its plain white background made transparent (only white connected to the edges), trimmed. */
async function cut_out(file: string): Promise<ReturnType<typeof sharp>> {
    const { data, info } = await sharp(file).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const has_alpha = (await sharp(file).metadata()).hasAlpha;
    if (!has_alpha) {
        const white = (i: number) => data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;
        const seen = new Uint8Array(width * height);
        const stack: number[] = [];
        for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
        for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
        while (stack.length) {
            const p = stack.pop()!;
            if (seen[p] || !white(p * 4)) continue;
            seen[p] = 1;
            data[p * 4 + 3] = 0;
            const x = p % width;
            if (x > 0) stack.push(p - 1);
            if (x < width - 1) stack.push(p + 1);
            if (p >= width) stack.push(p - width);
            if (p < width * (height - 1)) stack.push(p + width);
        }
    }
    const png = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return sharp(png).trim({ threshold: 1 });
}

async function save_logo(source: string, out: string, width: number) {
    const info = await (await cut_out(source)).resize({ width, kernel: "lanczos3", withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(path.join(OUT, out));
    return { src: site(out), width: info.width, height: info.height };
}

const logo_file = find("logo");
if (!logo_file) {
    console.error(`${folder}/logo.(png|jpg) is needed.`);
    process.exit(1);
}
const logo = await save_logo(logo_file, "logo.png", 440);
const logo_icon = await save_logo(find("logo_no_text") ?? logo_file, "logo-icon.png", 192);
const horizontal_file = find("logo_horizontal");
const logo_horizontal = horizontal_file ? await save_logo(horizontal_file, "logo-horizontal.png", 480) : undefined;
if (!find("logo_no_text")) note("• No logo_no_text: the full logo is used as the icon too (phones' header).");

let favicon: string;
if (existsSync(path.join(folder, "favicon.ico"))) {
    copyFileSync(path.join(folder, "favicon.ico"), path.join(OUT, "favicon.ico"));
    favicon = site("favicon.ico");
} else {
    await sharp(path.join(OUT, "logo-icon.png")).resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(OUT, "favicon.png"));
    favicon = site("favicon.png");
}

/** The logo's main bright colour (its gold, its blue…), used instead of the store's gold. */
async function accent_of(file: string): Promise<string | undefined> {
    const { data } = await sharp(file).resize(120, 120, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
        const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
        const s = d == 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
        if (s < 0.4 || l < 0.45 || l > 0.8) continue;
        const h = d == 0 ? 0 : max == r ? ((g - b) / d + 6) % 6 : max == g ? (b - r) / d + 2 : (r - g) / d + 4;
        const key = Math.floor(h * 2);
        const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        buckets.set(key, { n: bucket.n + 1, r: bucket.r + data[i], g: bucket.g + data[i + 1], b: bucket.b + data[i + 2] });
    }
    const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
    if (!top || top.n < 30) return undefined;
    return "#" + [top.r, top.g, top.b].map((v) => Math.round(v / top.n).toString(16).padStart(2, "0")).join("").toUpperCase();
}
const accent = await accent_of(path.join(OUT, "logo.png"));

// ---- hero, banners, trade-in background: the seller's own photos ------------------------------

const brightness = await Promise.all(built.map(async (b) => ({ b, mean: (await sharp(b.first_photo).greyscale().stats()).channels[0].mean })));
const by_dark = [...brightness].sort((a, b) => a.mean - b.mean).map((x) => x.b);
const hero_choice = built.find((b) => b.dir == flag("hero"));
if (hero_choice) {
    by_dark.splice(by_dark.indexOf(hero_choice), 1);
    by_dark.unshift(hero_choice);
}
const crop = (b: Built, out: string, w: number, h: number) =>
    sharp(b.first_photo).rotate().resize(w, h, { fit: "cover", position: "attention" }).withIccProfile("srgb").jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(path.join(OUT, out));
await crop(by_dark[0], "hero-desktop.jpg", 1920, 1200);
await crop(by_dark[0], "hero-poster.jpg", 1080, 1350);
await crop(by_dark[1 % by_dark.length], "banner-dark.jpg", 1600, 500);
await crop(by_dark[by_dark.length - 1], "banner-light.jpg", 1600, 500);
await crop(by_dark[2 % by_dark.length], "trade.jpg", 1600, 900);
let video: string | undefined;
if (existsSync(path.join(folder, "hero_vid.mp4"))) {
    copyFileSync(path.join(folder, "hero_vid.mp4"), path.join(OUT, "hero.mp4"));
    video = site("hero.mp4");
    note("• hero_vid.mp4 is copied as it is: trim it and compress it (a few MB) before deploying.");
}

// ---- collections, texts ------------------------------------------------------------------------

const counts = built.reduce<Record<string, Built[]>>((n, b) => ({ ...n, [b.piece.collection!]: [...(n[b.piece.collection!] ?? []), b] }), {});
const collections = Object.entries(counts)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, list]) => ({ key, name: COLLECTION_NAMES[key as Collection], image: list[0].piece.images[0] }));
const brands = [...new Set(built.map((b) => brand_name(b.piece.brand)))];
const brand_list = brands.length > 1 ? `${brands.slice(0, -1).join(", ")} and ${brands.at(-1)}` : brands[0];
const COUNTRIES: Record<string, string> = { mumbai: "India", delhi: "India", "new delhi": "India", bangalore: "India", bengaluru: "India", hyderabad: "India", chennai: "India", kolkata: "India", pune: "India", ahmedabad: "India", dubai: "United Arab Emirates", "abu dhabi": "United Arab Emirates", istanbul: "Türkiye", "i̇stanbul": "Türkiye", london: "United Kingdom", paris: "France", berlin: "Germany", munich: "Germany", milan: "Italy", madrid: "Spain", "hong kong": "Hong Kong", singapore: "Singapore", "new york": "United States" };
const where = city ? ` in ${city}` : "";

const config: DemoStoreSource = {
    slug,
    locale,
    name,
    ...(flag("instagram") ? { instagram: flag("instagram")!.replace(/^@/, "") } : previous?.instagram ? { instagram: previous.instagram } : {}),
    ...(whatsapp ? { whatsapp } : {}),
    ...(accent ? { accent } : {}),
    label: `Private demo · Prepared for ${name} · Payments in test mode`,
    footer_note: `This page is a private demo prepared for ${name}. Payments are in test mode; no real payment is taken.`,
    description: `${name}: pre-owned luxury watches${where}. ${brand_list}.`,
    logo,
    logo_icon,
    ...(logo_horizontal ? { logo_horizontal } : {}),
    favicon,
    hero: { title: name.toUpperCase(), subtitle: `Pre-owned luxury watches${where}`, poster: site("hero-poster.jpg"), desktop_image: site("hero-desktop.jpg"), ...(video ? { video } : {}) },
    new_arrivals: { heading: "New Arrivals", subtext: "The latest watches to join our collection." },
    brands_subtext: "Our selection from the world's leading watchmakers.",
    collections: { heading: "Collections", subtext: "Explore our watches by collection.", items: collections },
    trade_image: site("trade.jpg"),
    banner: { light: site("banner-light.jpg"), dark: site("banner-dark.jpg") },
    store: {
        address: { street: "", postcode: "", city: city ?? "", country: city ? (COUNTRIES[city.toLowerCase()] ?? "") : "" },
        opening_hours: { monday: "11:00 – 20:00", tuesday: "11:00 – 20:00", wednesday: "11:00 – 20:00", thursday: "11:00 – 20:00", friday: "11:00 – 20:00", saturday: "11:00 – 20:00", sunday: "" },
        about: `${name} is a ${city ? `${city}-based ` : ""}dealer of pre-owned luxury watches. Every watch is inspected before it is offered: authenticity, movement and condition are checked one by one, and most come as full sets with box and papers.\n\nWe specialise in ${brand_list}, and we can help you find a specific model.`,
    },
    pieces: built.map((b) => b.piece),
};

writeFileSync(`demos/${slug}.json`, JSON.stringify(config, null, 4) + "\n");

console.log(`\n${name} → demos/${slug}.json and ${OUT}/ (${built.length} watches)`);
console.log(`City: ${city ?? "none found"} · WhatsApp: ${whatsapp ?? "none found"} · Instagram: ${config.instagram ?? "none (add --instagram handle)"} · Accent: ${accent ?? "store gold"}`);
console.log(`Collections: ${collections.map((c) => `${c.name} (${counts[c.key].length})`).join(", ")}\n`);
for (const line of report) console.log(line);
console.log(`\nCheck the watches above (titles, prices, guessed details), then import:\n  npx tsx --conditions=react-server scripts/create-demo.ts demos/${slug}.json   (local database; add --production for the live one)\nPreview: /${locale}/${slug}`);
