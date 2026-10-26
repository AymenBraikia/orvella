"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { appointments_collection } from "@/app/db/collections";
import { booking_schema } from "./schema";

export type BookingResult = { ok: true } | { ok: false; error: "invalid" | "server" };

export default async function Submit(input: unknown): Promise<BookingResult> {
    const parsed = booking_schema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };

    try {
        await (
            await appointments_collection()
        ).insertOne({
            ...parsed.data,
            id: randomUUID(),
            date: new Date(`${parsed.data.date}T00:00:00.000Z`),
            status: "requested",
            handled: false,
            locale: await getLocale(),
            created_at: new Date(),
        });

        return { ok: true };
    } catch (error) {
        console.error("failed to save appointment request: ", error);
        return { ok: false, error: "server" };
    }
}
