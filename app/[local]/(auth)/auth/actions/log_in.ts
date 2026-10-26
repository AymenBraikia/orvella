"use server";

import { users_collection } from "@/app/db/collections";
import bcrypt from "bcrypt";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { safe_redirect } from "../safe_redirect";
import { merge_guest_cart } from "@/app/server/cart";
import { within_limit } from "@/app/server/rate_limit";
import { email_field, start_session, type AuthResult } from "./session";

const login_schema = z.object({ email: email_field, password: z.string().min(1).max(128) });

export default async function Log_in(data: FormData): Promise<AuthResult> {
    try {
        if (!(await within_limit("login"))) return { success: false, error: "rate" };

        const redirect = safe_redirect(data.get("redirect") as string | null);
        const parsed = login_schema.safeParse({ email: data.get("email"), password: data.get("password") });
        if (!parsed.success) return { success: false, error: parsed.error.issues.some((i) => i.path[0] == "email" && i.code != "too_small") ? "invalid_email" : "missing" };

        const { email, password } = parsed.data;
        const users = await users_collection();
        // New accounts are stored lower-case; older ones as typed.
        const user = (await users.findOne({ email })) ?? (await users.findOne({ email: String(data.get("email")).trim() }));

        // Same answer for "no account" and "wrong password", so emails cannot be probed.
        if (!user || !(await bcrypt.compare(password, user.password))) return { success: false, error: "wrong_credentials" };

        await start_session(user);

        // Pieces picked as a guest move into the account.
        await merge_guest_cart(user.email);

        revalidatePath("/");
        return { success: true, redirect };
    } catch (err) {
        console.error("Login failed:", err);
        return { success: false, error: "server" };
    }
}
