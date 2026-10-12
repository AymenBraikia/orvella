import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { users_collection } from "@/app/db/collections";
import { verifyJwt } from "@/app/(auth)/auth/jwt";

export interface AdminSession {
    email: string;
    name: string;
}

/**
 * Resolves the current admin, or null.
 *
 * The JWT is only used to identify the user. Admin rights are re-read from the
 * database on every call, so revoking someone does not wait out a 7 day token.
 */
export async function get_admin_session(): Promise<AdminSession | null> {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload?.email) return null;

    const user = await (await users_collection()).findOne({ email: payload.email }, { projection: { email: 1, firstName: 1, lastName: 1, admin: 1 } });

    if (!user?.admin) return null;

    return { email: user.email, name: `${user.firstName} ${user.lastName}` };
}

/** Use at the top of every admin page, layout and server action. */
export async function require_admin(): Promise<AdminSession> {
    const session = await get_admin_session();
    if (!session) redirect("/auth/log_in?redirect=/admin");
    return session;
}
