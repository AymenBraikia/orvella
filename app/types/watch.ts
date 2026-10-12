export interface Watch {
    slug: string;
    brand: string;
    brandSlug: string;
    model: string;
    reference: string;
    year: number;
    price: number;
    currency: "EUR";
    condition: "Pre-Owned" | "New";
    gender: "Men" | "Women";
    movement: "Automatic" | "Manual" | "Quartz";
    caseMaterial: string;
    caseDiameterMm: number;
    braceletMaterial: string;
    dialColor: string;
    waterResistanceM: number;
    boxPapers: { box: boolean; papers: boolean; firstInvoice: boolean; serviceInvoice: boolean };
    images: string[];
    description: string;
    inStock: boolean;
    featured: boolean;
    type: "watch";
    date_added: Date | string;
    relevance_score: number;
    preview?: string
}
