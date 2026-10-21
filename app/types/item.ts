import { Bracelet, Necklace, Ring } from "./jewelry";
import { Spare } from "./spare";
import { Watch } from "./watch";

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
    inStock: boolean;
    featured: boolean;
    type: "watch" | "spare" | "necklace" | "ring" | "bracelet";
    date_added: Date | string;
    relevance_score: number;
    preview?: string;
}

export type Item = Watch | Spare | Necklace | Ring | Bracelet;
