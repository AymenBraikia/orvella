"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { consignments_collection, sell_collection } from "@/app/db/collections";
import { is_stored_url } from "@/app/server/storage";
import { sell_schema } from "./schema";

export type SubmitResult = { ok: true } | { ok: false; error: "invalid" | "server" };

export default async function Submit(input: unknown): Promise<SubmitResult> {
    const parsed = sell_schema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };

    const data = parsed.data;
    // Only photos that went through our upload endpoint are accepted.
    if (!data.images.every((url) => is_stored_url(url, "sell"))) return { ok: false, error: "invalid" };

    const lead = {
        ...data,
        id: randomUUID(),
        status: "new" as const,
        handled: false,
        locale: await getLocale(),
        created_at: new Date(),
    };

    try {
        if (lead.intent == "consign") await (await consignments_collection()).insertOne({ ...lead, intent: "consign" });
        else await (await sell_collection()).insertOne({ ...lead, intent: "sell" });

        return { ok: true };
    } catch (error) {
        console.error("failed to save sell/consign request: ", error);
        return { ok: false, error: "server" };
    }
}
