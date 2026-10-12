import dynamic from "next/dynamic";

import shipping_info from "@/app/shipping.json";

import { format_price } from "../lib/price_format";
import { get_Currency } from "../lib/get_currency";
import { Supported_Currencies } from "@/currency";

import { getTranslations } from "next-intl/server";
import getUser from "@/app/server/get_user";

import Items from "./items";
import Pickup_wrapper from "@/app/components/wrappers/pickup";
import BankTransfer from "./bank";
import Payment_Options from "./options";
import Cards from "./Card";

const Paypal_component = dynamic(() => import("@/app/paypal/component"), {
    ssr: true,
});

const shipping_data = Object.values(shipping_info);

const payments = {
    PayPal: { name: "PayPal", fee: 0.03 },
    "Credit/Debit Card": { name: "Credit/Debit Card", fee: 0.014 },
    "Bank Transfer": { name: "Bank Transfer", fee: 0 },
};

export default async function Order_list() {
    const session = await getUser();
    if (!session) return <></>;

    const t = await getTranslations("checkout");
    const t_cart = await getTranslations("cart");

    const total = session.cart.reduce((prev, current) => prev + current.price * current.quantity, 0) || 0;

    const shipping = shipping_data.find((e) => e.country_name == session.address.country)!;

    const local_pickup = session.local_pickup;

    const payment_method = session.payment_method || "PayPal";

    const currency = (await get_Currency()) as Supported_Currencies;

    return (
        <div className="flex justify-start items-start flex-col gap-4 w-full h-fit font-secondary">
            <Items currency={currency} items={session.cart} />

            <div className="w-full flex justify-between items-center mt-2 border-b">
                <h5>{t("subtotal")}</h5>
                <h5>{format_price(total, currency)}</h5>
            </div>

            <div className="w-full flex flex-col justify-center items-start gap-4 border-b tracking-wider">
                <Pickup_wrapper />
                <div className={`w-full flex justify-between items-center ${local_pickup ? "line-through brightness-75" : ""}`}>
                    <p>{t_cart("shipping_to", { country: session.address.country })}</p>
                    <p>{format_price(shipping.shipping_cost, currency)}</p>
                </div>
                <div className="w-full flex justify-between items-center">
                    <p>{t("taxes")}</p>
                    <p>{format_price(0, currency)}</p>
                </div>
                <div className="w-full flex justify-between items-center">
                    <p>
                        {payments[payment_method as keyof typeof payments].name} {t("fee")}
                    </p>
                    <p>{format_price(payments[payment_method as keyof typeof payments].fee * total, currency)}</p>
                </div>

                <div className="w-full flex justify-between items-center">
                    <h5>{t_cart("total")}</h5>
                    <h5>{format_price(total + total * payments[payment_method as keyof typeof payments].fee + (local_pickup ? 0 : shipping.shipping_cost), currency)}</h5>
                </div>
            </div>

            <div className="w-full border-b">
                <h2>{t("payment")}</h2>
            </div>
            <Payment_Options default_option={payment_method} />

            {payment_method == "Bank Transfer" && <BankTransfer session={session} currency={currency} />}
            {payment_method == "Credit/Debit Card" && <Cards />}
            {payment_method == "PayPal" && <Paypal_component currency={currency} />}

            <p className="text-secondary">{t("agreement")}</p>
        </div>
    );
}
