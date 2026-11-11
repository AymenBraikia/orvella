"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { db, users_collection } from "@/app/db/collections";
import { within_limit } from "@/app/server/rate_limit";
import { notify_password_reset } from "@/app/server/email/notifications";
import { email_field, password_field, start_session } from "./session";

/*
 * "Forgot password": a random token is emailed; only its SHA-256 hash is stored, it expires after
 * an hour (TTL index in ensure-indexes) and works once. The request step never reveals whether an
 * account exists.
 */

type ResetDoc = { token_hash: string; email: string; expires_at: Date; created_at: Date };

const VALID_MINUTES = 60;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const resets = async () => (await db()).collection<ResetDoc>("password_resets");

export async function request_password_reset(data: FormData): Promise<{ ok: boolean; error?: "invalid_email" | "rate" }> {
    if (!(await within_limit("password_reset"))) return { ok: false, error: "rate" };

    const parsed = email_field.safeParse(data.get("email"));
    if (!parsed.success) return { ok: false, error: "invalid_email" };

    const users = await users_collection();
    const user = (await users.findOne({ email: parsed.data }, { projection: { email: 1, firstName: 1 } })) ?? (await users.findOne({ email: String(data.get("email")).trim() }, { projection: { email: 1, firstName: 1 } }));

    if (user) {
        const token = randomBytes(32).toString("hex");
        await (await resets()).insertOne({ token_hash: hash(token), email: user.email, expires_at: new Date(Date.now() + VALID_MINUTES * 60_000), created_at: new Date() });
        await notify_password_reset({ email: user.email, name: user.firstName, token, locale: await getLocale() });
    }

    return { ok: true };
}

const reset_schema = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/), password: password_field });

export async function reset_password(data: FormData): Promise<{ ok: boolean; error?: "invalid_token" | "weak_password" | "rate" }> {
    if (!(await within_limit("password_reset"))) return { ok: false, error: "rate" };

    const parsed = reset_schema.safeParse({ token: data.get("token"), password: data.get("password") });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.path[0] == "password" ? "weak_password" : "invalid_token" };

    // findOneAndDelete: a token can only be used once, even with two tabs racing.
    const reset = await (await resets()).findOneAndDelete({ token_hash: hash(parsed.data.token), expires_at: { $gt: new Date() } });
    if (!reset) return { ok: false, error: "invalid_token" };

    const users = await users_collection();
    const user = await users.findOneAndUpdate({ email: reset.email }, { $set: { password: await bcrypt.hash(parsed.data.password, 10) } }, { returnDocument: "after" });
    if (!user) return { ok: false, error: "invalid_token" };

    // Older links for the same account stop working too.
    await (await resets()).deleteMany({ email: reset.email });

    await start_session(user);
    return { ok: true };
}
