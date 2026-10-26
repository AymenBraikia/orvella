import "server-only";

import { randomBytes } from "node:crypto";

/** Order reference. Replaced by the sequential ORV-YYYY-NNNNNN counter in task 1.7. */
export async function next_order_number(): Promise<string> {
    return `ORV-${randomBytes(5).toString("hex").toUpperCase()}`;
}
