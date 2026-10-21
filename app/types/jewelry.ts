import { BaseItem } from "./item";

export interface Jewelry extends BaseItem {
    weight: number;
    measurement_unit: "grams" | "ounces";
    metal_type: "Gold" | "White Gold" | "Silver" | "Platinum";
    fineness?: number;
    karats?: number;
    stones?: string[];
}

export interface Ring extends Jewelry {
    type: "ring";
    ring_size: number | string;
    band_width?: number;
}

export interface Bracelet extends Jewelry {
    type: "bracelet";
    length: number;
    length_unit: "cm" | "inches";
    clasp_type?: string;
}

export interface Necklace extends Jewelry {
    type: "necklace";
    length: number;
    length_unit: "cm" | "inches";
    clasp_type?: string;
}

export type Details =
    | { type: "necklace"; length: number; length_unit: "cm" | "inches"; clasp_type?: string }
    | {
          type: "bracelet";
          length: number;
          length_unit: "cm" | "inches";
          clasp_type?: string;
      }
    | {
          type: "ring";
          ring_size: number | string;
          band_width?: number;
      };
