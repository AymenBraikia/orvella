"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { settings_collection } from "@/app/db/collections";
import { require_admin } from "@/app/server/admin_auth";
import { SETTINGS_ID } from "@/app/server/settings";
import { settings_schema } from "../settings/schema";

export type SettingsResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

export async function save_settings(input: unknown): Promise<SettingsResult> {
    await require_admin();

    const parsed = settings_schema.safeParse(input);
    if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
        return { ok: false, error: "Please fix the highlighted fields.", fields };
    }

    const settings = parsed.data;
    if (!settings.payments.paypal && !settings.payments.bank_transfer && !settings.payments.stripe) return { ok: false, error: "Keep at least one payment method enabled." };
    if (settings.payments.stripe && !process.env.STRIPE_SECRET_KEY) return { ok: false, error: "Card payments need STRIPE_SECRET_KEY to be configured on the server first." };

    await (await settings_collection()).updateOne({ _id: SETTINGS_ID }, { $set: { ...settings, updated_at: new Date() } }, { upsert: true });

    revalidateTag("settings", { expire: 0 });
    revalidatePath("/", "layout");
    return { ok: true };
}
