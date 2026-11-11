"use server";
import { cookies } from "next/headers";
import { Supported_Currencies, supported_currencies } from "@/currency";
import load_rates from "@/app/server/update_currency_rates";

export async function get_Currency(): Promise<Supported_Currencies> {
    const cookieStore = await cookies();
    const value = cookieStore.get("Currency")?.value;

    // Server components format prices right after asking for the currency: have the rates ready.
    await load_rates();
    return supported_currencies.includes(value as Supported_Currencies) ? (value as Supported_Currencies) : "USD";
}
