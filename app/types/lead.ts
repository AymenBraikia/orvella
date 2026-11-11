/** Workflow of a sell / consign request (and, later, product enquiries) in the admin. */
export type LeadStatus = "new" | "contacted" | "offer_made" | "closed" | "rejected";

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "offer_made", "closed", "rejected"];

/** Fields every lead shares, whichever collection it lives in. */
export interface LeadTracking {
    status: LeadStatus;
    /** Kept for older documents and code: true once the lead is no longer "new". */
    handled: boolean;
    notes?: string;
    locale?: string;
    created_at: Date | string;
    updated_at?: Date | string;
}
