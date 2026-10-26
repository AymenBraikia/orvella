"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cart_target } from "./cart";
import shipping_data from "@/app/shipping.json";

const shipping_values = Object.values(shipping_data);

const text = z.string().trim().max(200).optional();

const address_schema = z.object({
    country: z.string().trim().max(100),
    province: text,
    address1: text,
    address2: text,
    postCode: text,
    city: text,
    phone: text,
});

/**
 * Checkout details for the current visitor — a signed-in customer or a guest (stored with the
 * guest cart). Only the fields a customer may change about themselves. This is a server action, so anything
 * the browser sends ends up here — never accept admin flags, carts, orders or prices.
 */
const update_schema = z
    .object({
        address: address_schema,
        diff_address: address_schema.extend({ active: z.boolean() }),
        payment_method: z.enum(["PayPal", "Credit/Debit Card", "Bank Transfer"]),
        local_pickup: z.boolean(),
        // Guests only (an account's email and name are not changed here):
        email: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(200)]),
        firstName: z.string().trim().max(60),
        lastName: z.string().trim().max(60),
    })
    .partial()
    .strip();

export type UpdateUserInput = z.input<typeof update_schema>;

function shipping_cost_for(country: string): number {
    return shipping_values.find((e) => e.country_name == country)?.shipping_cost ?? 0;
}

export default async function updateUser(data: UpdateUserInput): Promise<boolean> {
    const target = await cart_target(true);
    if (!target) return false;

    const parsed = update_schema.safeParse(data);
    if (!parsed.success) return false;

    const update: Record<string, unknown> = {};
    const { address, diff_address, payment_method, local_pickup, email, firstName, lastName } = parsed.data;

    // Shipping costs are derived on the server, never taken from the client.
    if (address) update.address = { ...address, shipping_costs: shipping_cost_for(address.country) };
    if (diff_address) update.diff_address = { ...diff_address, shipping_costs: shipping_cost_for(diff_address.country) };
    if (payment_method) update.payment_method = payment_method;
    if (local_pickup !== undefined) update.local_pickup = local_pickup;
    if (target.guest) {
        if (email !== undefined) update.email = email;
        if (firstName !== undefined) update.firstName = firstName;
        if (lastName !== undefined) update.lastName = lastName;
    }

    if (!Object.keys(update).length) return false;

    const operation = await target.collection.updateOne(target.filter, { $set: { ...update, updated_at: new Date() } }, { upsert: target.guest });

    if (operation.acknowledged) {
        revalidatePath("/", "layout");
        return true;
    }

    return false;
}
