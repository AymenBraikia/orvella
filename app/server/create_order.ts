"use server";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import shippin_data from "@/app/shipping.json";
import { cookies } from "next/headers";
import { orders_collection, users_collection } from "../db/collections";
import { Order } from "@/types/order";
import { Supported_Currencies } from "@/currency";
import { calc_price } from "@/app/(site)/lib/calc_price";
import { revalidatePath } from "next/cache";

const shipping_values = Object.values(shippin_data);

export default async function create_order(): Promise<boolean> {
    const cookieStore = await cookies();
    const jwt_token = cookieStore.get("accessToken")?.value;

    const currency = cookieStore.get("Currency")?.value as Supported_Currencies;

    const zeroDecimalCurrencies = new Set(["JPY", "HUF", "TWD", "KRW", "UGX", "VND"]);
    const isZeroDecimal = zeroDecimalCurrencies.has(currency);

    let payload = null;

    if (!jwt_token) return false;
    else {
        payload = verifyJwt(jwt_token);

        if (!payload) return false;
    }
    const user = await (await users_collection()).findOne({ email: payload!.email });

    if (!user) return false;

    const TAX_RATE = user.payment_method == "Bank Transfer" ? 0 : 0.14;

    const items = user.cart;

    const shipping = !user.local_pickup && shipping_values.find((e) => e.country_name == user.address.country)!;

    const shipping_amount = shipping ? shipping.shipping_cost : 0;

    const total_amount: number = items.reduce((prev: number, item) => prev + Number(item.price) * Number(item.quantity), 0);

    const tax_amount: number = Math.floor(total_amount * TAX_RATE);

    const discount_amount = 0;

    const amount_to_pay = calc_price(total_amount + shipping_amount + tax_amount - discount_amount, currency).toFixed(isZeroDecimal ? 0 : 2);

    const target_address = user.diff_address.active
        ? {
              country: user.diff_address.country!,
              address1: user.diff_address.address1!,
              address2: user.diff_address.address2,
              city: user.diff_address.city!,
              postCode: user.diff_address.postCode!,
          }
        : {
              country: user.address.country!,
              address1: user.address.address1!,
              address2: user.address.address2,
              city: user.address.city!,
              postCode: user.address.postCode!,
          };

    const order: Order = {
        id: `${Math.floor(Math.random() * 1e9)}`,
        email: payload.email,
        currency,
        items,
        total: total_amount,
        discount_amount: Number(discount_amount),
        amount_to_pay: Number(amount_to_pay),
        status: "Pending",
        created_at: new Date(),
        payment_method: user.payment_method!,
        shipping,
        address: user.local_pickup ? "Local Pickup" : target_address,
    };

    const operation = await (await orders_collection()).insertOne(order);
    const operation2 = await (await users_collection()).updateOne({ email: user.email }, { $set: { current_order: order } });

    revalidatePath("/", "layout");

    return operation.acknowledged && operation2.acknowledged ? true :false;
}
