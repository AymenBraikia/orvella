"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { appointments_collection } from "@/app/db/collections";
import { booking_schema } from "./schema";
import { after } from "next/server";
import { notify_appointment_requested } from "@/app/server/email/notifications";
import type { Appointment } from "@/types/appointment";

export type BookingResult = { ok: true } | { ok: false; error: "invalid" | "server" };

export default async function Submit(input: unknown): Promise<BookingResult> {
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
