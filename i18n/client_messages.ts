import "server-only";

import { getMessages } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";

/**
 * Only the translation namespaces that client components use. The rest (legal texts, brand
 * histories, FAQ, emails…) is rendered on the server and does not need to ship with every page.
 */
export async function client_messages(namespaces: string[]): Promise<AbstractIntlMessages> {
    const all = await getMessages();
    return Object.fromEntries(namespaces.filter((ns) => ns in all).map((ns) => [ns, all[ns]])) as AbstractIntlMessages;
}

export const SITE_CLIENT_NAMESPACES = ["common", "cart", "checkout", "product", "home", "sell", "booking", "consultation", "demo", "error", "notFound", "intrest", "payments"];
