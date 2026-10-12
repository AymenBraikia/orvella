"use server";

import { users_collection } from "@/app/db/collections";
import bcrypt from "bcrypt";

import { signJwtAccessToken } from "../jwt";
import { cookies } from "next/headers";

import { revalidatePath } from "next/cache";
import { authRegex } from "../regex";

export default async function Log_in(data: FormData): Promise<{ success: boolean; error?: string; redirect?: string | null }> {
    try {
        const redirect = data.get("redirect") as string | null;
        const email = data.get("email") as string | null;
        const password = data.get("password") as string | null;

        if (!email || !password) return { success: false, error: "Make sure to enter all the required information." };

        if (!authRegex.email.test(email)) return { success: false, error: "Enter a valid email." };
        if (!authRegex.password.test(password)) return { success: false, error: "Password should be atleast 8 characters long." };
        // if (!authRegex.password.test(password)) return { success: false, error: "Password should include atleast 1 special character, 1 upper case letter, 1 number." };

        const exists = await (await users_collection()).findOne({ email });

        if (!exists) return { success: false, error: "Wrong email or password" };

        const isPasswordValid = await bcrypt.compare(password, exists.password);

        if (!isPasswordValid) return { success: false, error: "Wrong email or password" };

        const cookieStore = await cookies();

        const payload = {
            email: email,
            full_name: exists.firstName + " " + exists.lastName,
            admin: exists.admin === true,
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
            value: exists.firstName + " " + exists.lastName,
            httpOnly: false,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
        });

        revalidatePath("/");

        return { success: true, redirect };
    } catch (err) {
        console.log("There was an error during a login attempt:");
        console.error(err);
        return { success: false, error: "There was an error while trying to sign you up." };
    }
}
