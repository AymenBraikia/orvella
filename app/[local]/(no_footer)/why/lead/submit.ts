"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { pitch_leads_collection } from "@/app/db/collections";
import { notify_pitch_lead } from "@/app/server/email/notifications";
import { is_bot, within_limit } from "@/app/server/rate_limit";
import { active_ref } from "@/app/server/ref";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { lead_schema } from "./schema";
import type { PitchLead } from "@/types/pitch_lead";

export type LeadResult = { ok: true } | { ok: false; error: "invalid" | "server" | "rate" };

export default async function submit_lead(input: unknown): Promise<LeadResult> {
    // /why only exists on the demo; a dealer's shop must not collect these.
    if (!DEMO_MODE) return { ok: false, error: "invalid" };
    // Spam trap and per-IP limit (silently "succeed" for bots so they do not retry).
    if (is_bot(input)) return { ok: true };
    if (!(await within_limit("pitch_lead"))) return { ok: false, error: "rate" };

    const parsed = lead_schema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };

    const lead: PitchLead = {
        ...parsed.data,
        message: parsed.data.message || undefined,
        id: randomUUID(),
        ref: await active_ref(),
        locale: await getLocale(),
        created_at: new Date(),
    };

    try {
        await (await pitch_leads_collection()).insertOne({ ...lead });
        after(() => notify_pitch_lead(lead));
        return { ok: true };
    } catch (error) {
        console.error("failed to save demo request: ", error);
        return { ok: false, error: "server" };
    }
}
