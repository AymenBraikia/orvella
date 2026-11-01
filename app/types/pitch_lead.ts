/** A dealer asking for a custom demo through the form on /why (demo deployment only). */
export interface PitchLead {
    id: string;
    name: string;
    business: string;
    /** Email address or WhatsApp number, as typed. */
    contact: string;
    /** Instagram, Chrono24 or website link (or an @handle). */
    stock_url: string;
    message?: string;
    /** The ?ref= pitch link the visitor came from, if any. */
    ref?: string;
    locale: string;
    created_at: Date;
}
