"use server";

import { UpdateUserProps } from "@/types/user";
import { cookies } from "next/headers";
import { users_collection } from "../db/collections";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { revalidatePath } from "next/cache";

export default async function updateUser(data: UpdateUserProps): Promise<boolean> {
    const cookieStore = await cookies();

    const token = cookieStore.get("accessToken")?.value;
    if (!token) return false;

    const payload = verifyJwt(token);
    if (!payload) return false;

    const operation = await (await users_collection()).updateOne({ email: payload.email }, { $set: data });

    if (operation.acknowledged) {
        revalidatePath("/", "layout");
        return true;
    }

    return false;
}
