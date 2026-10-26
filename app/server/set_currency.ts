"use server";
import { Supported_Currencies, supported_currencies } from "@/currency";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import getUser from "./get_user";
import { users_collection } from "../db/collections";

export default async function setCurrency(currency: Supported_Currencies) {
    if (!supported_currencies.includes(currency)) return;

    const cookieStore = await cookies();

    const user = await getUser();
    if (user?.current_order) await (await users_collection()).updateOne({ email: user.email }, { $unset: { current_order: "" } });

    cookieStore.set("Currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
    revalidatePath("/", "layout");
}
