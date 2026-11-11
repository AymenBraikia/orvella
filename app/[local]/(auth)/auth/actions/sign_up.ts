"use server";

import { orders_collection, users_collection } from "@/app/db/collections";
import { User } from "@/app/types/user";
import bcrypt from "bcrypt";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { safe_redirect } from "../safe_redirect";
import { merge_guest_cart } from "@/app/server/cart";
import { is_bot, within_limit } from "@/app/server/rate_limit";
import { email_field, password_field, start_session, type AuthResult } from "./session";

const sign_up_schema = z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: email_field,
    password: password_field,
});

const EMPTY_ADDRESS = { shipping_costs: 55, country: "Germany", address1: undefined, address2: undefined, postCode: undefined, city: undefined, phone: undefined };

export default async function Sign_up(data: FormData): Promise<AuthResult> {
    try {
        // Bots filling the hidden field get a "success" and no account.
        if (is_bot({ website: data.get("website") })) return { success: true, redirect: "/" };
        if (!(await within_limit("sign_up"))) return { success: false, error: "rate" };

        const redirect = safe_redirect(data.get("redirect") as string | null);
        const parsed = sign_up_schema.safeParse(Object.fromEntries(["firstName", "lastName", "email", "password"].map((k) => [k, data.get(k) ?? ""])));
        if (!parsed.success) {
            const field = parsed.error.issues[0]?.path[0];
            return { success: false, error: field == "email" && data.get("email") ? "invalid_email" : field == "password" && data.get("password") ? "weak_password" : "missing" };
        }

        const { firstName, lastName, email, password } = parsed.data;
        const users = await users_collection();

        const taken = await users.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }, { projection: { _id: 1 } });
        if (taken) return { success: false, error: "email_taken" };

        const user_document: User = {
            email,
            firstName,
            lastName,
            password: await bcrypt.hash(password, 10),
            cart: [],
            wish_list: [],
            ongoing_orders: [],
            fulfilled_orders: [],
            local_pickup: false,
            payment_method: "PayPal",
            address: EMPTY_ADDRESS,
            diff_address: { ...EMPTY_ADDRESS, active: false },
        };

        await users.insertOne(user_document);

        // Account created right after a guest purchase: attach that order (proved by its access token).
        const claim_order = data.get("claim_order");
        const claim_token = data.get("claim_token");
        if (typeof claim_order == "string" && typeof claim_token == "string" && claim_order && claim_token.length >= 32) {
            await (await orders_collection()).updateOne({ id: claim_order, access_token: claim_token, email, guest: true }, { $set: { guest: false }, $unset: { cart_id: "" } });
        }

        await start_session(user_document);

        // Pieces picked as a guest move into the account.
        await merge_guest_cart(email);

        revalidatePath("/");
        return { success: true, redirect };
    } catch (err) {
        console.error("Sign-up failed:", err);
        return { success: false, error: "server" };
    }
}
