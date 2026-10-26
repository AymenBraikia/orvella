export type AppointmentStatus = "requested" | "confirmed" | "cancelled" | "done";

export interface Appointment {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    reason?: string | undefined;
    /** Requested day (stored as midnight UTC of the chosen calendar date). */
    date: Date | string;
    status?: AppointmentStatus;
    notes?: string;
    locale?: string;
    /** Legacy flag from before statuses existed. */
    handled?: boolean;
    created_at?: Date | string;
    updated_at?: Date | string;
}
