"use server";

import { users_collection } from "@/app/db/collections";
import { User } from "@/app/types/user";
import bcrypt from "bcrypt";

import { signJwtAccessToken } from "../jwt";
import { cookies } from "next/headers";

import { revalidatePath } from "next/cache";
import { authRegex } from "../regex";

export default async function Sign_up(data: FormData): Promise<{ success: boolean; error?: string; redirect?: string | null }> {
    try {
        const redirect = data.get("redirect") as string | null;
        const firstName = data.get("firstName") as string | null;
        const lastName = data.get("lastName") as string | null;

        const email = data.get("email") as string | null;

        const password = data.get("password") as string | null;

        if (!firstName || !lastName || !email || !password) return { success: false, error: "Make sure to enter all the required information." };

        if (!authRegex.email.test(email)) return { success: false, error: "Enter a valid email." };
        if (!authRegex.password.test(password)) return { success: false, error: "Password should be atleast 8 characters long." };
        // if (!authRegex.password.test(password)) return { success: false, error: "Password should include atleast 1 special character, 1 upper case letter, 1 number." };

        const exists = await (await users_collection()).findOne({ email });

        if (exists) return { success: false, error: "Someone else already uses this email address use another one." };

        const cookieStore = await cookies();

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user_document: User = {
            email,
            firstName,
            lastName,
            password: hashedPassword,
            cart: [],
            wish_list: [],
            ongoing_orders: [],
            fulfilled_orders: [],
            local_pickup: false,
            payment_method: "PayPal",
            address: {
                country: "Germany",
                address1: undefined,
                address2: undefined,
                postCode: undefined,
                city: undefined,
                phone: undefined,
            },
            diff_address: {
                country: "Germany",
                address1: undefined,
                address2: undefined,
                postCode: undefined,
                city: undefined,
                phone: undefined,
                active: false,
            },
        };

        const operation = await (await users_collection()).insertOne(user_document);

        const payload = {
            email: email,
            full_name: firstName + " " + lastName,
        };

        const accessToken = signJwtAccessToken(payload);

        cookieStore.set({
            name: "accessToken",
            value: accessToken,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
        });
        cookieStore.set({
            name: "name",
            value: firstName,
            httpOnly: false,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
        });

        revalidatePath("/");

        return operation.acknowledged ? { success: true, redirect } : { success: false, error: "There was an error while trying to sign you up." };
    } catch (err) {
        console.log("There was an error during a sign up attempt:");
        console.error(err);
        return { success: false, error: "There was an error while trying to sign you up." };
    }
}
