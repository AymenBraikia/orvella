import { z } from "zod";

export type BookingMessages = { required: string; invalidEmail: string; futureDate: string };

export const BOOKING_SERVER_MESSAGES: BookingMessages = { required: "required", invalidEmail: "invalid email", futureDate: "date must be in the future" };

/** "YYYY-MM-DD" from the date input, kept as a plain calendar date (no time zone shifts). */
const calendar_date = /^\d{4}-\d{2}-\d{2}$/;

function today_utc(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Shared by the booking form (browser) and its server action. */
export function booking_schema(m: BookingMessages = BOOKING_SERVER_MESSAGES) {
    return z.object({
        firstName: z.string().trim().min(1, m.required).max(60),
        lastName: z.string().trim().min(1, m.required).max(60),
        email: z.string().trim().email(m.invalidEmail).max(200),
        phone: z.string().trim().min(1, m.required).max(40),
        reason: z.string().trim().max(2000).optional(),
        date: z
            .string()
            .regex(calendar_date, m.required)
            // lenient by a day: the browser offers "tomorrow" in the visitor's own time zone
            .refine((value) => value >= today_utc(), m.futureDate),
    });
}

export type BookingInput = z.input<ReturnType<typeof booking_schema>>;
export type BookingOutput = z.output<ReturnType<typeof booking_schema>>;
