import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { Collection, Document, Filter } from "mongodb";
import get_item from "./get_item";
import { carts_collection, users_collection } from "../db/collections";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { max_cart_quantity, to_public_item } from "@/app/(site)/lib/stock";
import type { Cart_Item, Cart_Line, User } from "@/types/user";
import type { PaymentMethod } from "@/types/order";

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

/*
 * Who owns the cart: a signed-in customer (users document) or a guest (carts document, found by
 * the random cart_id cookie). Both documents use the same field names (cart, address,
 * diff_address, local_pickup, payment_method), so every cart/checkout write works on either.
 */

export const CART_COOKIE = "cart_id";
const CART_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUEST_CART_DAYS = 90;

/** The common shape of a users document and a carts document, as far as carts are concerned. */
type CartDocument = { _id?: string; cart: Cart_Line[]; updated_at?: Date };

export type CartTarget = { collection: Collection<CartDocument>; filter: Filter<CartDocument>; guest: boolean; id: string };

async function signed_in_email(): Promise<string | null> {
    const token = (await cookies()).get("accessToken")?.value;
    const payload = token ? verifyJwt(token) : null;
    return typeof payload?.email == "string" ? payload.email : null;
}

export async function guest_cart_id(): Promise<string | null> {
    const id = (await cookies()).get(CART_COOKIE)?.value;
    return id && CART_ID_PATTERN.test(id) ? id : null;
}

/** The document holding this visitor's cart. With `create`, a guest gets a cart id (server actions only). */
export async function cart_target(create = false): Promise<CartTarget | null> {
    const email = await signed_in_email();
    if (email) return { collection: (await users_collection()) as unknown as Collection<CartDocument>, filter: { email }, guest: false, id: email };

    let id = await guest_cart_id();
    if (!id) {
        if (!create) return null;
        id = randomUUID();
        (await cookies()).set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: GUEST_CART_DAYS * 24 * 60 * 60 });
    }
    return { collection: (await carts_collection()) as unknown as Collection<CartDocument>, filter: { _id: id }, guest: true, id };
}

const EMPTY_ADDRESS: User["address"] = { shipping_costs: 0, country: "Germany", address1: undefined, address2: undefined, postCode: undefined, city: undefined, phone: undefined };

/** Everything checkout needs about the customer, for signed-in users and guests alike. */
export type CheckoutCustomer = {
    guest: boolean;
    /** For guests: the cart id, stored on the order so the same browser can finish payment. */
    cart_id?: string;
    email: string;
    firstName: string;
    lastName: string;
    local_pickup: boolean;
    payment_method?: PaymentMethod;
    address: User["address"];
    diff_address: User["diff_address"];
    cart: Cart_Line[];
};

export async function get_checkout_customer(): Promise<CheckoutCustomer | null> {
    const target = await cart_target();
    if (!target) return null;

    const doc = await target.collection.findOne(target.filter, { projection: { _id: 0, password: 0 } });
    if (!doc && !target.guest) return null;

    const d = (doc ?? {}) as Partial<User> & { cart?: Cart_Line[] };
    return {
        guest: target.guest,
        cart_id: target.guest ? target.id : undefined,
        email: d.email ?? "",
        firstName: d.firstName ?? "",
        lastName: d.lastName ?? "",
        local_pickup: Boolean(d.local_pickup),
        payment_method: d.payment_method,
        address: { ...EMPTY_ADDRESS, ...d.address },
        diff_address: { ...EMPTY_ADDRESS, active: false, ...d.diff_address },
        cart: (d.cart ?? []).map((l) => ({ slug: l.slug, quantity: l.quantity })),
    };
}

/** Lines in this visitor's cart (no item data). */
export async function read_cart_lines(): Promise<Cart_Line[]> {
    return (await get_checkout_customer())?.cart ?? [];
}

/** Remove purchased pieces from whichever cart placed the order. */
export async function remove_from_cart(target: { guest: boolean; id: string }, slugs: string[]) {
    const update = { $pull: { cart: { slug: { $in: slugs } } } } as Document;
    if (target.guest) await (await carts_collection()).updateOne({ _id: target.id }, update);
    else await (await users_collection()).updateOne({ email: target.id }, update);
}

/** After login / sign-up: move the guest cart into the account and forget the guest cart. */
export async function merge_guest_cart(email: string) {
    const id = await guest_cart_id();
    if (!id) return;

    const carts = await carts_collection();
    const guest = await carts.findOne({ _id: id });

    if (guest?.cart?.length) {
        const users = await users_collection();
        const user = await users.findOne({ email }, { projection: { cart: 1 } });
        const have = new Set((user?.cart ?? []).map((l) => l.slug));
        const add = guest.cart.filter((l) => !have.has(l.slug)).map((l) => ({ slug: l.slug, quantity: l.quantity }));
        if (add.length) await users.updateOne({ email }, { $push: { cart: { $each: add } } });
    }

    await carts.deleteOne({ _id: id });
    (await cookies()).delete(CART_COOKIE);
}
