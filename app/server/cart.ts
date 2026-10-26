import "server-only";

import get_item from "./get_item";
import { max_cart_quantity, to_public_item } from "@/app/(site)/lib/stock";
import type { Cart_Item, Cart_Line } from "@/types/user";

/**
 * Carts store only slug + quantity. Older carts hold a full item snapshot; either way the item
 * data shown to the customer comes from the current catalogue, never from the stored copy.
 */
export async function hydrate_cart(lines: Cart_Line[] | undefined): Promise<Cart_Item[]> {
    if (!lines?.length) return [];

    const now = Date.now();
    const items = await Promise.all(lines.map((line) => get_item(line.slug)));

    return lines.flatMap((line, i) => {
        const item = items[i];
        if (!item || item.deleted) return [];

        return [{ ...to_public_item(item, now), quantity: line.quantity, max_quantity: max_cart_quantity(item, now) } as Cart_Item];
    });
}
