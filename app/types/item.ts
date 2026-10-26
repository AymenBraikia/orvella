import { Bracelet, Necklace, Ring } from "./jewelry";
import { Spare } from "./spare";
import { Watch } from "./watch";

export type ItemStatus = "available" | "reserved" | "sold";

/** A hold on stock while an order waits for payment. Released when `until` passes. */
export interface Reservation {
    order_id: string;
    quantity: number;
    until: Date | string;
}

export interface BaseItem {
    slug: string;
    display_name: string;
    price: number;
    currency: "EUR";
    condition: "Pre-Owned" | "New";
    gender: "Men" | "Women";
    images: string[];
    video?: string;
    description: string;
    /** Kept in sync with `status` for the shop filters: true while something can be bought. */
    inStock: boolean;
    featured: boolean;
    type: "watch" | "spare" | "necklace" | "ring" | "bracelet";
    date_added: Date | string;
    relevance_score: number;
    preview?: string;

    /** Units free to sell (not counting reserved ones). 1 for unique pieces. Missing on legacy documents. */
    quantity?: number;
    /** Denormalised from quantity + reservations on every stock write. */
    status?: ItemStatus;
    reservations?: Reservation[];
    sold_at?: Date | string;
    deleted?: boolean;
    updated_at?: Date | string;

    /** Resolved on the server before an item is sent to the browser (see to_public_item). */
    stock_status?: ItemStatus;
    available_quantity?: number;
}

export type Item = Watch | Spare | Necklace | Ring | Bracelet;
