import { BaseItem } from "./item";

export interface Watch extends BaseItem {
    brand: string;
    brandSlug: string;
    model: string;
    reference: string;
    year: number;
    movement: "Automatic" | "Manual" | "Quartz";
    caseMaterial: string;
    caseDiameterMm: number;
    braceletMaterial: string;
    dialColor: string;
    waterResistanceM: number;
    boxPapers: { box: boolean; papers: boolean; firstInvoice: boolean; serviceInvoice: boolean };
    type: "watch";
}
