import "server-only";

import { cookies } from "next/headers";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

/** The ?ref= pitch name. Demo only: on a dealer's shop the cookie is ignored, so a link can't rename the store. */
export async function active_ref(): Promise<string | undefined> {
    if (!DEMO_MODE) return undefined;
    return (await cookies()).get("ref")?.value;
}
