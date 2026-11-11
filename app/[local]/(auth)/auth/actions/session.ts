import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { signJwtAccessToken } from "../jwt";

export type AuthError = "missing" | "invalid_email" | "weak_password" | "wrong_credentials" | "email_taken" | "rate" | "server";
export type AuthResult = { success: true; redirect?: string | null } | { success: false; error: AuthError };

export const email_field = z.string().trim().toLowerCase().email().max(200);
/** At least 8 characters (the old rule also demanded a leading letter, with a misleading message). */
export const password_field = z.string().min(8).max(128);

const WEEK = 60 * 60 * 24 * 7;

/** Sign the session cookie (httpOnly JWT) and the display-name cookie. */
export async function start_session(user: { email: string; firstName: string; lastName: string; admin?: boolean }) {
    const cookieStore = await cookies();
    const full_name = `${user.firstName} ${user.lastName}`.trim();

    cookieStore.set({
        name: "accessToken",
        value: signJwtAccessToken({ email: user.email, full_name, admin: user.admin === true }),
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: WEEK,
    });
    cookieStore.set({ name: "name", value: full_name, httpOnly: false, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: WEEK });
}
