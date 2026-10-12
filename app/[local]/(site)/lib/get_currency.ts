"use server";
import { cookies } from "next/headers";
import { Supported_Currencies } from "@/currency";

export async function get_Currency(): Promise<Supported_Currencies> {
    const cookieStore = await cookies();
    const value = cookieStore.get("Currency")?.value;

    return (value as Supported_Currencies) ?? "USD";
}
