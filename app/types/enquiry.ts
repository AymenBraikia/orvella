import type { LeadTracking } from "./lead";

/** A question about a specific piece from its product page (or a request to reserve it). */
export interface Enquiry extends LeadTracking {
    id: string;
    type: "question" | "reservation";
    item: { slug: string; name: string; reference?: string; price: number };
    name: string;
    email: string;
    phone?: string;
    message?: string;
}
