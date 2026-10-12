export interface Appointment {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    reason?: string | undefined;
    id?: string;
    handled?: boolean;
    created_at?: Date | string;
}
