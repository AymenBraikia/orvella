import type { BaseItem, ItemStatus, Reservation } from "@/types/item";

/** Watches and jewelry are one-of-one pieces; only spare parts can be stocked in multiples. */
export function is_unique_type(type: BaseItem["type"]): boolean {
    return type !== "spare";
}

function time(value: Date | string): number {
    return new Date(value).getTime();
}

/** Units in the document that are not held by a reservation. Legacy documents only have `inStock`. */
export function stored_quantity(item: Pick<BaseItem, "quantity" | "inStock">): number {
    if (typeof item.quantity === "number") return Math.max(0, item.quantity);
    return item.inStock === false ? 0 : 1;
}

export function active_reservations(item: Pick<BaseItem, "reservations">, now = Date.now()): Reservation[] {
    return (item.reservations ?? []).filter((r) => time(r.until) > now);
}

/**
 * What can be sold right now. Expired reservations count as free again even before the database
 * has been cleaned up, so a stale cache never shows a lapsed hold as "reserved".
 */
export function available_quantity(item: Pick<BaseItem, "quantity" | "inStock" | "reservations">, now = Date.now()): number {
    const expired = (item.reservations ?? []).filter((r) => time(r.until) <= now).reduce((sum, r) => sum + r.quantity, 0);
    return stored_quantity(item) + expired;
}

export function stock_status(item: Pick<BaseItem, "quantity" | "inStock" | "reservations">, now = Date.now()): ItemStatus {
    if (available_quantity(item, now) > 0) return "available";
    return active_reservations(item, now).length ? "reserved" : "sold";
}

/** The most a customer may put in their cart. */
export function max_cart_quantity(item: Pick<BaseItem, "quantity" | "inStock" | "reservations" | "type">, now = Date.now()): number {
    const available = available_quantity(item, now);
    return is_unique_type(item.type) ? Math.min(1, available) : available;
}

/**
 * Shape sent to the browser: stock is resolved, reservations (which carry order numbers) are removed,
 * and `inStock` is kept in sync for the existing filters.
 */
export function to_public_item<T extends BaseItem>(item: T, now = Date.now()): T {
    const { reservations, ...rest } = item;
    void reservations;

    const status = stock_status(item, now);

    return {
        ...rest,
        stock_status: status,
        available_quantity: available_quantity(item, now),
        inStock: status === "available",
    } as T;
}
