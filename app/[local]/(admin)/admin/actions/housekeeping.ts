"use server";

import { require_admin } from "@/app/server/admin_auth";
import { release_expired_orders } from "@/app/server/orders";

export async function admin_housekeeping(): Promise<number> {
    await require_admin();
    return (await release_expired_orders()).length;
}
