"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { users_collection } from "../db/collections";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { revalidatePath } from "next/cache";
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
 * Only the fields a customer may change about themselves. This is a server action, so anything
 * the browser sends ends up here — never accept admin flags, carts, orders or prices.
 */
const update_schema = z
    .object({
        address: address_schema,
        diff_address: address_schema.extend({ active: z.boolean() }),
        payment_method: z.enum(["PayPal", "Credit/Debit Card", "Bank Transfer"]),
        local_pickup: z.boolean(),
    })
    .partial()
    .strip();

export type UpdateUserInput = z.input<typeof update_schema>;

function shipping_cost_for(country: string): number {
    return shipping_values.find((e) => e.country_name == country)?.shipping_cost ?? 0;
}

export default async function updateUser(data: UpdateUserInput): Promise<boolean> {
    const cookieStore = await cookies();

    const token = cookieStore.get("accessToken")?.value;
    if (!token) return false;

    const payload = verifyJwt(token);
    if (!payload) return false;

    const parsed = update_schema.safeParse(data);
    if (!parsed.success) return false;

    const update: Record<string, unknown> = {};
    const { address, diff_address, payment_method, local_pickup } = parsed.data;

    // Shipping costs are derived on the server, never taken from the client.
    if (address) update.address = { ...address, shipping_costs: shipping_cost_for(address.country) };
    if (diff_address) update.diff_address = { ...diff_address, shipping_costs: shipping_cost_for(diff_address.country) };
    if (payment_method) update.payment_method = payment_method;
    if (local_pickup !== undefined) update.local_pickup = local_pickup;

    if (!Object.keys(update).length) return false;

    const operation = await (await users_collection()).updateOne({ email: payload.email }, { $set: update });

    if (operation.acknowledged) {
        revalidatePath("/", "layout");
        return true;
    }

    return false;
}
