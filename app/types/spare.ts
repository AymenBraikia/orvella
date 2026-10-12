import type { Watch } from "./watch";

export type SpareCategory = "Dial" | "Hands" | "Crown" | "Crystal" | "Bracelet" | "Bezel" | "Movement" | "Battery" | "Caseback" | "Stem" | "Other";

export interface Spare extends Omit<Watch, "type"> {
    waterResistanceM: 0;
    boxPapers: { box: false; papers: false; firstInvoice: false; serviceInvoice: false };

    partName: string;
    spareCategory: SpareCategory;
    compatibleModels: string[];
    tags?: string[];
    type: "spare";
}


