/*
 * Reads a seller's Instagram caption ("ROLEX SUBMARINER DATE 41MM … REF. NO.:- 126610LV … FULL SET – 2023
 * … CONDITION:- 9.5/10 … PRICE:- 1,75,000/- … 📍 MUMBAI") into product fields. Captions are free
 * text: everything is a best guess, reported by scripts/build-lead-demo.ts for a human to check.
 */

export type Currency = "INR" | "EUR" | "USD" | "GBP" | "TRY" | "AED";

export interface ParsedCaption {
    brand?: string;
    /** Model family ("Submariner Date", "Datejust 41"), with a nickname if the caption gives one. */
    model?: string;
    family?: string;
    collection?: Collection;
    nickname?: string;
    reference?: string;
    size_mm?: number;
    year?: number;
    material?: string;
    dial?: string;
    bracelet?: string;
    movement?: "Automatic" | "Manual" | "Quartz";
    box: boolean;
    papers: boolean;
    condition_score?: number;
    condition_note?: string;
    is_new: boolean;
    price?: { amount: number; currency: Currency };
    retail?: { amount: number; currency: Currency };
    extras: string[];
    city?: string;
    whatsapp?: string;
    /** The caption's own descriptive sentences (not its field lines or calls to action). */
    sentences: string[];
}

/** Brand: how it is written in captions (regex) → store spelling (lowercase, like the catalogue). */
const BRANDS: [RegExp, string][] = [
    [/\baudemars\s*piguet\b|\bAP\s+ROYAL\b/i, "audemars piguet"],
    [/\bpatek\s*philippe\b/i, "patek philippe"],
    [/\brichard\s*mille\b/i, "richard mille"],
    [/\bvacheron\s*constantin\b/i, "vacheron constantin"],
    [/\bjaeger[\s-]*le\s*coultre\b/i, "jaeger-lecoultre"],
    [/\ba\.?\s*lange\b/i, "a. lange & söhne"],
    [/\btag\s*heuer\b/i, "tag heuer"],
    [/\bgrand\s*seiko\b/i, "grand seiko"],
    [/\bulysse\s*nardin\b/i, "ulysse nardin"],
    [/\bfranck\s*muller\b/i, "franck muller"],
    [/\bgirard[\s-]*perregaux\b/i, "girard-perregaux"],
    [/\brolex\b/i, "rolex"],
    [/\bomega\b/i, "omega"],
    [/\bpanerai\b/i, "panerai"],
    [/\bcartier\b/i, "cartier"],
    [/\btudor\b/i, "tudor"],
    [/\biwc\b/i, "iwc"],
    [/\bhublot\b/i, "hublot"],
    [/\bbreitling\b/i, "breitling"],
    [/\bbreguet\b/i, "breguet"],
    [/\bzenith\b/i, "zenith"],
    [/\blongines\b/i, "longines"],
    [/\bchopard\b/i, "chopard"],
    [/\bbvlgari\b|\bbulgari\b/i, "bvlgari"],
    [/\bblancpain\b/i, "blancpain"],
];

/** Model families, longest first so "GMT-Master II" wins over "GMT". [regex, name, collection]. */
export type Collection = "diver" | "gmt" | "chronograph" | "classic" | "sport";
const FAMILIES: [RegExp, string, Collection][] = [
    [/submariner\s*date/i, "Submariner Date", "diver"],
    [/submariner/i, "Submariner", "diver"],
    [/sea[\s-]*dweller/i, "Sea-Dweller", "diver"],
    [/gmt[\s-]*master\s*(ii|2)/i, "GMT-Master II", "gmt"],
    [/gmt[\s-]*master/i, "GMT-Master", "gmt"],
    [/sky[\s-]*dweller/i, "Sky-Dweller", "gmt"],
    [/explorer\s*(ii|2)/i, "Explorer II", "gmt"],
    [/explorer/i, "Explorer", "sport"],
    [/daytona/i, "Cosmograph Daytona", "chronograph"],
    [/yacht[\s-]*master/i, "Yacht-Master", "sport"],
    [/day[\s-]*date/i, "Day-Date", "classic"],
    [/datejust/i, "Datejust", "classic"],
    [/oyster\s*perpetual/i, "Oyster Perpetual", "classic"],
    [/air[\s-]*king/i, "Air-King", "sport"],
    [/milgauss/i, "Milgauss", "sport"],
    [/cellini/i, "Cellini", "classic"],
    [/speedmaster/i, "Speedmaster", "chronograph"],
    [/seamaster/i, "Seamaster", "diver"],
    [/aqua\s*terra/i, "Seamaster Aqua Terra", "sport"],
    [/constellation/i, "Constellation", "classic"],
    [/de\s*ville/i, "De Ville", "classic"],
    [/luminor\s*marina/i, "Luminor Marina", "diver"],
    [/luminor\s*due/i, "Luminor Due", "classic"],
    [/luminor/i, "Luminor", "diver"],
    [/radiomir/i, "Radiomir", "classic"],
    [/submersible/i, "Submersible", "diver"],
    [/tank/i, "Tank", "classic"],
    [/santos[\s-]*dumont/i, "Santos-Dumont", "classic"],
    [/santos/i, "Santos", "sport"],
    [/ballon\s*bleu/i, "Ballon Bleu", "classic"],
    [/royal\s*oak\s*offshore/i, "Royal Oak Offshore", "chronograph"],
    [/royal\s*oak/i, "Royal Oak", "sport"],
    [/nautilus/i, "Nautilus", "sport"],
    [/aquanaut/i, "Aquanaut", "sport"],
    [/calatrava/i, "Calatrava", "classic"],
    [/black\s*bay\s*chrono/i, "Black Bay Chrono", "chronograph"],
    [/black\s*bay/i, "Black Bay", "diver"],
    [/pelagos/i, "Pelagos", "diver"],
    [/portugieser|portuguese/i, "Portugieser", "classic"],
    [/big\s*bang/i, "Big Bang", "chronograph"],
    [/navitimer/i, "Navitimer", "chronograph"],
    [/chrono(graph)?/i, "Chronograph", "chronograph"],
];

/** Known nicknames (Rolex mostly), kept in quotes after the model. */
const NICKNAMES = ["starbucks", "kermit", "hulk", "batman", "batgirl", "pepsi", "sprite", "root beer", "bluesy", "zombie", "panda", "wimbledon", "smurf", "polar", "coke", "bruce wayne", "rootbeer", "chocolate", "sundust", "bluesea", "ice blue"];

const DIAL_COLOURS = ["mother of pearl", "champagne", "chocolate", "sundust", "slate grey", "slate", "black", "blue", "white", "green", "silver", "grey", "gray", "brown", "pink", "red", "yellow", "gold", "salmon", "ice blue", "meteorite"];

/** Emojis, markdown stars and the "‼️" kind of punctuation. */
function clean(text: string): string {
    return text
        .replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|[\u{1F1E6}-\u{1F1FF}]/gu, "")
        .replace(/[*_]+/g, "")
        .replace(/[–—]/g, "-")
        .replace(/[ \t]+/g, " ");
}

/** "1,75,000/-", "₹3,50,000", "17,20,000" (Indian grouping), "€12.500", "$9,500" → number. */
function amount(raw: string): number | undefined {
    const digits = raw.replace(/[^\d.,]/g, "").replace(/[.,](?=\d{3}(\D|$))/g, "").replace(/,/g, "");
    const n = Number(digits);
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

function currency_of(line: string, fallback: Currency): Currency {
    if (/₹|\bINR\b|\bRS\.?\b|\/-/i.test(line)) return "INR";
    if (/€|\bEUR\b/i.test(line)) return "EUR";
    if (/£|\bGBP\b/i.test(line)) return "GBP";
    if (/₺|\bTL\b|\bTRY\b/i.test(line)) return "TRY";
    if (/\bAED\b|\bDHS?\b/i.test(line)) return "AED";
    if (/\$|\bUSD\b/i.test(line)) return "USD";
    return fallback;
}

/** "BLACK DIAL" → "Black", "SLATE GREY DIAL" → "Slate Grey". */
function title_case(s: string): string {
    return s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep: string, c: string) => sep + c.toUpperCase());
}

/** All-caps caption text as a normal sentence ("THE ICONIC ROLEX …" → "The iconic Rolex …"). */
export function sentence_case(s: string, proper: string[]): string {
    const lower = s.trim().toLowerCase();
    let out = lower.charAt(0).toUpperCase() + lower.slice(1);
    for (const word of proper) out = out.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()}\\b`, "g"), word);
    return out.replace(/\s+([.,!?])/g, "$1").replace(/(\d)mm\b/gi, "$1 mm");
}

const FIELD_LINE = /:-|:\s|^\s*(ref|size|condition|price|mrp|retail|movement)\b/i;
/** What a descriptive sentence has and a title line does not. */
const NARRATIVE = /\b(the|featuring|combines|iconic|stunning|true|classic|perfectly|balances|paired|elegant)\b/i;
const CALL_TO_ACTION = /\b(dm|whatsapp|wa\.me|feel free|shipping|deal|steal|query|queries|details|negotiable|contact|call|price)\b/i;

export function parse_caption(raw: string, default_currency: Currency = "INR"): ParsedCaption {
    const text = clean(raw);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const upper = text.toUpperCase();
    const out: ParsedCaption = { box: false, papers: false, is_new: false, extras: [], sentences: [] };

    out.brand = BRANDS.find(([rx]) => rx.test(text))?.[1];

    const family = FAMILIES.find(([rx]) => rx.test(text));
    out.family = family?.[1];
    out.collection = family?.[2];

    // Size: "41MM", "41 mm", "41MM X 31MM" (the first number is the case size).
    const size = text.match(/\b(\d{2}(?:\.\d)?)\s*mm\b/i);
    if (size) out.size_mm = Number(size[1]);

    // Reference: "REF. NO.:- 126610LV", "REF:-126713GRNR", "REF. NO. :- 123.10.35.20.02.001"; else a Rolex-style number in the title.
    const ref = text.match(/\bref(?:erence)?\.?\s*(?:no\.?)?\s*[:\-.\s]*\s*([A-Z0-9][A-Z0-9./-]{2,})/i);
    if (ref) out.reference = ref[1].replace(/[.-]+$/, "").toUpperCase();
    else {
        const bare = lines.slice(0, 4).join(" ").match(/\b(1[0-9]{4,5}[A-Z]{0,6}|2[0-9]{5}[A-Z]{0,6}|3[0-9]{5}[A-Z]{0,6}|PAM\d{3,5})\b/);
        if (bare) out.reference = bare[1];
    }

    // Year: "FULL SET – 2023", "DATED 2024", "(2023)", "DECEMBER 2020" — never inside a price.
    for (const line of lines) {
        if (/price|mrp|retail|₹|\/-/i.test(line)) continue;
        const y = line.match(/\b(19[5-9]\d|20[0-3]\d)\b/);
        if (y) {
            out.year = Number(y[1]);
            break;
        }
    }

    const nickname = text.match(/"([^"]{3,20})"/)?.[1] ?? NICKNAMES.find((n) => new RegExp(`\\b${n}\\b`, "i").test(text));
    if (nickname) out.nickname = title_case(nickname);

    // Material.
    const two_tone = upper.match(/STEEL\s*(?:&|AND)?\s*(YELLOW|ROSE|WHITE|EVEROSE)?\s*GOLD/);
    if (two_tone) out.material = `Steel & ${two_tone[1] ? title_case(two_tone[1]) + " " : ""}Gold`;
    else if (/(\d{2})\s*K[T]?\s*(ROSE|YELLOW|WHITE|RED)\s*GOLD/.test(upper)) {
        const m = upper.match(/(\d{2})\s*K[T]?\s*(ROSE|YELLOW|WHITE|RED)\s*GOLD/)!;
        out.material = `${m[1]}k ${title_case(m[2])} Gold`;
    } else if (/(ROSE|YELLOW|WHITE|RED) GOLD/.test(upper)) out.material = `18k ${title_case(upper.match(/(ROSE|YELLOW|WHITE|RED) GOLD/)![1])} Gold`;
    else if (/TITANIUM/.test(upper)) out.material = "Titanium";
    else if (/CERAMIC CASE/.test(upper)) out.material = "Ceramic";
    else if (/\bSTEEL\b/.test(upper)) out.material = "Stainless Steel";

    // Dial: "BLUE INDEX DIAL", "BLACK DIAMOND DIAL", "SLATE GREY DIAL", or a dial nickname line ("CHOCOLATE DIAMOND").
    const dial_text = upper.match(/([A-Z][A-Z ]{2,30}?)\s+DIAL/)?.[1].toLowerCase() ?? "";
    // Without "… DIAL", a colour word in the first lines (not one of a material: "ROSE GOLD", "STEEL & GOLD").
    const title_lines = lines.slice(0, 4).filter((l) => !/GOLD|STEEL|SILVER/i.test(l)).join(" ");
    const colour = DIAL_COLOURS.find((c) => dial_text.includes(c)) ?? DIAL_COLOURS.filter((c) => !/gold|silver|yellow|white/.test(c)).find((c) => new RegExp(`\\b${c}\\b`, "i").test(title_lines));
    if (colour) out.dial = title_case(colour.replace("gray", "grey")) + (/DIAMOND/.test(upper) && !/BEZEL/.test(upper.match(/DIAMOND[^\n]{0,15}/)?.[0] ?? "") ? " Diamond" : "");

    if (/JUBILEE/.test(upper)) out.bracelet = "Jubilee bracelet";
    else if (/OYSTERFLEX/.test(upper)) out.bracelet = "Oysterflex bracelet";
    else if (/PRESIDENT/.test(upper)) out.bracelet = "President bracelet";
    else if (/OYSTER BRACELET/.test(upper)) out.bracelet = "Oyster bracelet";
    else if (/RUBBER/.test(upper)) out.bracelet = "Rubber strap";
    else if (/LEATHER|ALLIGATOR|STRAP/.test(upper)) out.bracelet = "Leather strap";

    if (/QUARTZ/.test(upper)) out.movement = "Quartz";
    else if (/MANUAL|HAND[\s-]*WOUND/.test(upper)) out.movement = "Manual";
    else if (/AUTOMATIC|CO-AXIAL|CALIBRE|CALIBER/.test(upper)) out.movement = "Automatic";

    // Box and papers.
    const full = /FULL SET/.test(upper);
    out.box = full || /\bBOX\b/.test(upper);
    out.papers = !/NO CARD|NO PAPERS|WITHOUT (CARD|PAPERS)/.test(upper) && (full || /\bCARD\b|PAPERS|WARRANTY/.test(upper));
    if (/ONLY WATCH\b(?!\s*&|\s*AND)|WATCH ONLY/.test(upper)) out.box = out.papers = false;

    const cond = text.match(/condition\s*[:\-\s]*\s*(\d+(?:\.\d)?)\s*\/\s*10\s*(?:\(\s*([^)]+?)\s*\))?/i);
    if (cond) {
        out.condition_score = Number(cond[1]);
        if (cond[2]) out.condition_note = cond[2].toLowerCase().replace(/supermint/, "super mint");
    }
    out.is_new = /\b(UNWORN|BRAND NEW|NEW WATCH)\b/.test(upper);

    // Prices: "PRICE:- 1,75,000/-" (the asking price), "MRP"/"RETAIL" (the list price).
    for (const line of lines) {
        const n = line.match(/(?:₹|€|\$|£|\bINR\b|\bRS\.?)?\s*(\d{1,3}(?:[.,]\d{2,3})+(?:\.\d+)?|\d{4,})\s*(?:\/-)?/);
        if (!n) continue;
        const value = amount(n[1]);
        if (!value || value < 500) continue;
        const cur = currency_of(line, default_currency);
        if (/\b(MRP|RETAIL)\b/i.test(line)) out.retail ??= { amount: value, currency: cur };
        else if (/\bPRICE\b|₹|€|\$|£/i.test(line)) out.price ??= { amount: value, currency: cur };
    }

    if (/FULL LINKS/.test(upper)) out.extras.push("full links");
    if (/LINK SHORT/.test(upper)) out.extras.push(title_case(upper.match(/\d+\s*LINK SHORT/)?.[0] ?? "a link short").toLowerCase());
    if (/BOTH (ORIGINAL )?TAGS/.test(upper)) out.extras.push("both original tags");
    if (/EXTRA STRAP/.test(upper)) out.extras.push("an extra strap");
    if (/ONLINE REGISTERED/.test(upper)) out.extras.push("online registered");
    if (/SEE[\s-]*THROUGH|EXHIBITION CASEBACK/.test(upper)) out.extras.push("see-through caseback");

    const pin = raw.match(/📍\s*([^\n]+)/u)?.[1];
    if (pin) out.city = title_case(clean(pin).trim());

    const wa = raw.match(/wa\.me\/\+?(\d{8,15})/i) ?? raw.match(/whats\s*app[^\n\d+]*(\+?\d[\d\s]{8,16}\d)/i);
    if (wa) out.whatsapp = wa[1].replace(/\D/g, "");

    // Descriptive sentences: long lines that are neither fields nor calls to action.
    for (const line of lines) {
        if (line.split(/\s+/).length < 9 || !NARRATIVE.test(line) || FIELD_LINE.test(line) || CALL_TO_ACTION.test(line)) continue;
        out.sentences.push(line);
    }
    return out;
}
