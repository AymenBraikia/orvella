"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { appointments_collection } from "@/app/db/collections";
import { booking_schema } from "./schema";
import { is_bot, within_limit } from "@/app/server/rate_limit";
import { after } from "next/server";
import { notify_appointment_requested } from "@/app/server/email/notifications";
import type { Appointment } from "@/types/appointment";

export type BookingResult = { ok: true } | { ok: false; error: "invalid" | "server" | "rate" };

export default async function Submit(input: unknown): Promise<BookingResult> {
    // Spam trap and per-IP limit (silently "succeed" for bots so they do not retry).
    if (is_bot(input)) return { ok: true };
    if (!(await within_limit("booking"))) return { ok: false, error: "rate" };

    const parsed = booking_schema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };

    try {
        const appointment: Appointment = {
            ...parsed.data,
            id: randomUUID(),
            date: new Date(`${parsed.data.date}T00:00:00.000Z`),
            status: "requested",
            handled: false,
            locale: await getLocale(),
            created_at: new Date(),
        };
        await (await appointments_collection()).insertOne({ ...appointment });

        after(() => notify_appointment_requested(appointment));

        return { ok: true };
    } catch (error) {
        console.error("failed to save appointment request: ", error);
        return { ok: false, error: "server" };
    }
}
