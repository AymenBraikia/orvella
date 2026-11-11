import type { CheckoutCustomer } from "@/app/server/cart";

/** Enough saved to place the order? (The server checks again when the order is created.) */
export function details_complete(c: CheckoutCustomer): boolean {
    const contact = Boolean(c.email && c.firstName && c.lastName);
    if (c.local_pickup) return contact && Boolean(c.address.phone);

    const a = c.diff_address.active ? c.diff_address : c.address;
    return contact && Boolean(a.address1 && a.postCode && a.city && a.country && (a.phone || c.address.phone));
}
