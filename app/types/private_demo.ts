import type { Binary } from "mongodb";
import type { Supported_Currencies } from "@/currency";

/** "mixed": the seller has both; each piece then says whether it is a watch or which jewelry. */
export type DemoCategory = "watches" | "jewelry" | "mixed";
/** What a piece is: one of the storefront's product types, so it appears on that category page. */
export type DemoPieceKind = "watch" | "ring" | "bracelet" | "necklace";
export type DemoLanguage = "en" | "fr" | "tr";

export const DEMO_CATEGORIES: DemoCategory[] = ["watches", "jewelry", "mixed"];
export const DEMO_PIECE_KINDS: DemoPieceKind[] = ["watch", "ring", "bracelet", "necklace"];
export const DEMO_LANGUAGES: DemoLanguage[] = ["en", "fr", "tr"];
export const DEMO_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "HKD", "SGD", "JPY", "CNY"] as const satisfies readonly Supported_Currencies[];
export type DemoCurrency = (typeof DEMO_CURRENCIES)[number];

export const MAX_DEMO_PIECES = 30;
export const MAX_PIECE_PHOTOS = 8;

/** One of the seller's pieces. It is shown as a storefront product (see demo_item in app/server/private_demos.ts). */
export interface DemoPiece {
    id: string;
    title: string;
    /** In EUR, like every storefront price; the store converts it into the visitor's currency. */
    price: number;
    description: string;
    /** Ids of photos in private_demo_photos that belong to this demo. */
    photos: string[];
    /** Required unless the demo only has watches (see piece_kind). */
    kind?: DemoPieceKind;
    /** Watches: the brand, only when it is clearly shown (e.g. on the dial). The store names a watch "brand model". */
    brand?: string;
    /** The storefront's product details, as far as they are known. Anything missing is not shown. */
    details?: DemoPieceDetails;
    /** A collection of the seller's (a shop filter), e.g. from a lead demo config (demos/<slug>.json). */
    collection?: string;
}

/** The same details a storefront product has (types/watch.ts, types/jewelry.ts), all optional. */
export interface DemoPieceDetails {
    condition?: "New" | "Pre-Owned";
    gender?: "Men" | "Women";
    // Watches
    reference?: string;
    year?: number;
    movement?: "Automatic" | "Manual" | "Quartz";
    caseMaterial?: string;
    caseDiameterMm?: number;
    braceletMaterial?: string;
    dialColor?: string;
    waterResistanceM?: number;
    /** Scope of delivery. */
    box?: boolean;
    papers?: boolean;
    // Jewelry
    metal_type?: "Gold" | "White Gold" | "Silver" | "Platinum";
    karats?: number;
    stones?: string[];
    weight_g?: number;
    ring_size?: string;
    length_cm?: number;
}

/** What a piece is. A watch demo's pieces are always watches; jewelry is never a watch. */
export function piece_kind(category: DemoCategory, piece: Pick<DemoPiece, "kind">): DemoPieceKind {
    if (category == "watches") return "watch";
    const kind = piece.kind ?? "ring";
    return category == "jewelry" && kind == "watch" ? "ring" : kind;
}

/**
 * A private, personalised store for one sales lead, opened at corlane.store/<slug>: the real
 * storefront under the seller's name, showing only the seller's pieces (storefront products tagged
 * with `preview: name`, the ?ref= mechanism). Nothing links to it.
 */
export interface PrivateDemo {
    id: string;
    slug: string;
    /** Shown as the store name; also the ref the visitor gets, so it is unique and ref-safe. */
    name: string;
    /** Handle without the @. */
    instagram?: string;
    category: DemoCategory;
    /** The storefront language the link opens in. */
    language: DemoLanguage;
    /** The currency the store shows prices in for the visitor (they can still switch). */
    currency: DemoCurrency;
    pieces: DemoPiece[];
    enabled: boolean;
    /** Visits by people (not the admin, not link-preview bots). */
    views: number;
    first_opened_at?: Date | string;
    last_opened_at?: Date | string;
    /** Set when the pieces changed outside a request (the CLI script), so the next visit refreshes the store's caches. */
    stale?: boolean;
    created_at: Date | string;
    updated_at: Date | string;
}

/** What the admin form sends: everything the admin can change. */
export type PrivateDemoInput = Pick<PrivateDemo, "slug" | "name" | "instagram" | "category" | "language" | "currency" | "pieces">;

/** Photos are stored in MongoDB, so they work wherever the database works (no file storage needed). */
export interface PrivateDemoPhoto {
    _id: string;
    demo_id: string;
    content_type: string;
    size: number;
    data: Binary;
    created_at: Date;
}
