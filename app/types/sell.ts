import type { LeadTracking } from "./lead";

export interface Sell extends Partial<LeadTracking> {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    intent: "sell";
    brand: string;
    price: number;
    condition: "new" | "mint" | "pre-owned";
    /** Public URLs of the uploaded photos. */
    images: string[];
    model?: string | undefined;
    refNum?: string | undefined;
    box?: boolean | undefined;
    papers?: boolean | undefined;
    message?: string | undefined;
    id: string;
}
