"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { enquiries_collection } from "@/app/db/collections";
import { read_items_fresh } from "@/app/server/inventory";
import { notify_enquiry } from "@/app/server/email/notifications";
import { item_name } from "../../../lib/item_name";
import { enquiry_schema } from "./schema";
import { is_bot, within_limit } from "@/app/server/rate_limit";
import type { Enquiry } from "@/types/enquiry";

export type EnquiryResult = { ok: true } | { ok: false; error: "invalid" | "server" | "rate" };

export default async function submit_enquiry(input: unknown): Promise<EnquiryResult> {
    // Spam trap and per-IP limit (silently "succeed" for bots so they do not retry).
    if (is_bot(input)) return { ok: true };
    if (!(await within_limit("enquiry"))) return { ok: false, error: "rate" };

    const parsed = enquiry_schema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };

    const { slug, ...data } = parsed.data;
    const [item] = await read_items_fresh([slug]);
    if (!item || item.deleted) return { ok: false, error: "invalid" };

    const enquiry: Enquiry = {
        ...data,
        id: randomUUID(),
        item: { slug: item.slug, name: item_name(item), reference: item.type == "watch" || item.type == "spare" ? item.reference : undefined, price: item.price },
        status: "new",
        handled: false,
        locale: await getLocale(),
        created_at: new Date(),
    };

    try {
        await (await enquiries_collection()).insertOne({ ...enquiry });
        after(() => notify_enquiry(enquiry));
        return { ok: true };
    } catch (error) {
        console.error("failed to save enquiry: ", error);
        return { ok: false, error: "server" };
    }
}
