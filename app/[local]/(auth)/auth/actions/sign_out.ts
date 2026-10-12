"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function signOut(): Promise<void | { error: string }> {
    try {
        const cookieStore = await cookies();

        cookieStore.delete("accessToken");
        cookieStore.delete("name");

        revalidatePath("/");
    } catch {
        return { error: "Internal Server Error" };
    }
}
