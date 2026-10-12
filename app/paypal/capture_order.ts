"use server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { getAccessToken } from "./paypal";
import { orders_collection, users_collection } from "../db/collections";
import { capture_result, Order } from "@/types/order";
import { revalidatePath } from "next/cache";
import score_rewards from "@/app/(site)/lib/relevance_score";
import increase_relevance_score from "../server/increase_relevance_score";

export async function capture_order({ orderID }: { orderID: string }): Promise<void | capture_result> {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    let payload;


    if (!token) return;
    else {
        payload = verifyJwt(token);
        if (!payload) return;
    }

    const paypalToken = await getAccessToken();

    const res = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${paypalToken}`,
            "Content-Type": "application/json",
        },
    });

    const data: capture_result = await res.json();

    try {
        if (data.status != "COMPLETED") {
            const order = await (await orders_collection()).findOneAndUpdate({ id: orderID }, { $set: { status: "Failed", capture_id: data.id } });
            if (!order) return;

            await (
                await users_collection()
            ).findOneAndUpdate(
                { email: order.email },
                {
                    $set: {
                        "recent_activity.$[activity].status": 1,
                    },
                },
                {
                    arrayFilters: [{ "activity.id": orderID }],
                },
            );

            return;
        }
        let order = (await (await orders_collection()).findOne({ id: orderID })) as Order | null;

        if (!order) return;
        if (order.email != payload.email) return;
        if (order.status == "Completed") return;

        const paypal_addr = data.purchase_units[0].shipping?.address;
        const newAddr = paypal_addr
            ? {
                  address1: paypal_addr.address_line_1,
                  address2: paypal_addr.address_line_2,
                  city: paypal_addr.admin_area_1,
                  province: paypal_addr.admin_area_2,
                  postCode: paypal_addr.postal_code,
                  country: paypal_addr.country_code,
              }
            : undefined;
        order = (await (await orders_collection()).findOneAndUpdate({ id: orderID }, { $set: newAddr ? { status: "Completed", address: newAddr } : { status: "Completed" } }))!;

        const user = await (
            await users_collection()
        ).findOneAndUpdate(
            { email: order.email },
            {
                $pullAll: {
                    cart: order.items,
                },
                $push: {
                    ongoing_orders: newAddr ? { ...order, address: newAddr } : order,
                },
            },
            { returnDocument: "after" },
        );

        if (!user) return;

        order.items.forEach(async (i) => await increase_relevance_score(i.slug, score_rewards.purchase));

        revalidatePath("/");

        return { ...data, redirect: "/thank_you/" };
    } catch (error) {
        console.log("Caught an error: ", error);
        return;
    }
}
