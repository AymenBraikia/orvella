export type Visitor = {
    id: string;
    timestamp: Date;

    /** Keyed hash of the IP address (see save_visit); the address itself is not stored. */
    ip_hash?: string;
    userAgent: string;
    referer?: string;

    device?: "desktop" | "mobile" | "tablet" | "unknown";
    browser?: string;
    os?: string;

    visits: number;
    set: boolean;

    saw_pop_up: boolean;
    closed: boolean;
    ignored: boolean;
    clicked: boolean;
};
