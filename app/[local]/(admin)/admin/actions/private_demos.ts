"use server";

import { revalidatePath } from "next/cache";
import { require_admin } from "@/app/server/admin_auth";
import { invalidate_items } from "@/app/server/inventory";
import { delete_demo, demo_item_slugs, mark_demo_fresh, save_demo, set_demo_enabled, type SaveDemoResult } from "@/app/server/private_demos";

/** The demo's products changed: show it in the store now, like a product saved in the admin. */
async function refresh_store(id: string, slugs?: string[]) {
    invalidate_items(slugs ?? (await demo_item_slugs(id)));
    revalidatePath("/", "layout");
}

export async function save_private_demo(id: string, input: unknown): Promise<SaveDemoResult> {
    await require_admin();
    const result = await save_demo(id, input);
    if (result.ok) {
        await refresh_store(id);
        await mark_demo_fresh(id);
    }
    return result;
}

export async function set_private_demo_enabled(id: string, enabled: boolean): Promise<boolean> {
    await require_admin();
    const ok = await set_demo_enabled(id, Boolean(enabled));
    await refresh_store(id);
    return ok;
}

export async function delete_private_demo(id: string): Promise<boolean> {
    await require_admin();
    const { deleted, slugs } = await delete_demo(id);
    await refresh_store(id, slugs);
    return deleted;
}
