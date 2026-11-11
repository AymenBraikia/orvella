import "server-only";

import { cookies } from "next/headers";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { users_collection } from "../db/collections";

/**
 * The signed-in admin, re-checked against the database on every call — a 7-day token must not
 * keep admin rights alive after they were removed. Returns null for everyone else.
 */
export async function get_admin(): Promise<{ email: string; name: string } | null> {
    const token = (await cookies()).get("accessToken")?.value;
    const payload = token ? verifyJwt(token) : null;
    if (!payload?.email) return null;

    const user = await (await users_collection()).findOne({ email: payload.email, admin: true }, { projection: { email: 1, firstName: 1, lastName: 1 } });
    if (!user) return null;

    return { email: user.email, name: `${user.firstName} ${user.lastName}`.trim() };
}

/** For admin server actions: throws unless the caller is (still) an admin. */
export async function require_admin(): Promise<{ email: string; name: string }> {
    const admin = await get_admin();
    if (!admin) throw new Error("Not authorised");
    return admin;
}
