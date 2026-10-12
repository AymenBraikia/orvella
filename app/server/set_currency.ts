"use server";
import { Supported_Currencies } from "@/currency";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import getUser from "./get_user";
import updateUser from "./update_user";

export default async function setCurrency(currency: Supported_Currencies) {
    const cookieStore = await cookies();

    const user = await getUser();
    if (user?.current_order) await updateUser({ current_order: undefined });

    cookieStore.set("Currency", currency);
    revalidatePath("/", "layout");
}
