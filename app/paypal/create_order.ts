"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { getAccessToken } from "./paypal";
import { orders_collection, users_collection } from "../db/collections";

import { get_Currency } from "@/app/(site)/lib/get_currency";
import { calc_price } from "@/app/(site)/lib/calc_price";
import shippin_data from "@/app/shipping.json";

const shipping_values = Object.values(shippin_data);

const TAX_RATE = 0.03;

export async function create_order(): Promise<string> {
    const token = await getAccessToken();

    const cookieStore = await cookies();
    const jwt_token = cookieStore.get("accessToken")?.value;

    let payload = null;

    if (!jwt_token) return "";
    else {
        payload = verifyJwt(jwt_token);

        if (!payload) return "";
    }
    const user = await (await users_collection()).findOne({ email: payload!.email });

    if (!user) return "";

    const shipping = !user.local_pickup && shipping_values.find((e) => e.country_name == user.address.country)!;

    const cart = user.cart;

    const currency = await get_Currency();
    const zeroDecimalCurrencies = new Set(["JPY", "HUF", "TWD", "KRW", "UGX", "VND"]);
    const isZeroDecimal = zeroDecimalCurrencies.has(currency);

    const items = cart.map((item) => ({
        name: item.brand + item.model,
        description: item.description,
        quantity: item.quantity.toString(),
        unit_amount: {
            currency_code: currency,
            // value: calc_price(item.price, currency),
            value: calc_price(item.price, currency).toFixed(isZeroDecimal ? 0 : 2),
        },
    }));

    const ref_id = `ORDER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const shipping_amount = shipping ? shipping.shipping_cost : 0;

    const total_amount: number = items.reduce((prev: number, item) => prev + Number(item.unit_amount.value) * Number(item.quantity), 0);

    const tax_amount: number = Math.floor(total_amount * TAX_RATE);

    const discount_amount = 0;

    const amount_to_pay = total_amount + shipping_amount + tax_amount - discount_amount;
    // const amount_to_pay = isZeroDecimal ? Math.floor(amount_to_pay_cents / 100) : amount_to_pay_cents / 100;

    const res = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: ref_id,
                    description: "arvell",
                    items,

                    amount: {
                        currency_code: currency,
                        value: amount_to_pay,
                        breakdown: {
                            item_total: { currency_code: currency, value: total_amount },
                            tax_total: { currency_code: currency, value: tax_amount },
                            handling: { currency_code: currency, value: isZeroDecimal ? "0" : "0.00" },
                            discount: { currency_code: currency, value: discount_amount },
                            shipping: {
                                currency_code: currency,
                                value: shipping_amount,
                            },
                        },
                    },

                    application_context: {
                        brand_name: "arvell",
                        locale: "en-US",
                        landing_page: "LOGIN",
                        shipping_preference: "NO_SHIPPING",
                        user_action: "PAY_NOW",

                        return_url: (process.env.NODE_ENV == "development" ? "http://localhost:3000" : "https://arvell.vercel.app") + "/thank_you/",
                        cancel_url: (process.env.NODE_ENV == "development" ? "http://localhost:3000" : "https://arvell.vercel.app") + "/cart/",
                    },
                },
            ],
        }),
    });

    const order = await res.json();

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

    if (order.id) {
        await (
            await orders_collection()
        ).insertOne({
            id: order.id,
            email: payload.email,
            currency,
            items: cart,
            total: total_amount,
            discount_amount: Number(discount_amount),
            amount_to_pay: Number(amount_to_pay),
            status: "Pending",
            created_at: new Date(),
            payment_method: "PayPal",
            shipping,
            address: user.local_pickup ? "Local Pickup" : target_address,
        });

        return order.id;
    } else return "";
}
