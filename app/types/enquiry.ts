import type { LeadTracking } from "./lead";

/** A question about a specific piece from its product page (or a request to reserve it). */
export interface Enquiry extends LeadTracking {
    id: string;
    type: "question" | "reservation";
    /** For a private demo, `slug` is the piece id and `price` (in the demo's currency) may be missing. */
    item: { slug: string; name: string; reference?: string; price?: number };
    /** Set when the enquiry came from a private demo (corlane.store/<slug>), not the storefront. */
    demo?: { id: string; slug: string; name: string; currency: string };
    name: string;
    email: string;
    phone?: string;
    message?: string;
}
