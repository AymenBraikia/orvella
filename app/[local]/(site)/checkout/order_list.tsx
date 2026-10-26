import dynamic from "next/dynamic";

import { get_Currency } from "../lib/get_currency";

import { getTranslations } from "next-intl/server";
import getUser from "@/app/server/get_user";
import { build_quote } from "@/app/server/checkout";
import { get_settings } from "@/app/server/settings";

import Items from "./items";
import Pickup_wrapper from "@/app/components/wrappers/pickup";
import BankTransfer from "./bank";
import Payment_Options from "./options";
import TotalsBreakdown from "./totals";

const Paypal_component = dynamic(() => import("@/app/paypal/component"), {
    ssr: true,
});

export default async function Order_list() {
    const session = await getUser();
    if (!session) return <></>;

    const t = await getTranslations("checkout");
    const t_cart = await getTranslations("cart");
    const t_errors = await getTranslations("checkout.errors");

    const currency = await get_Currency();
    const quote = await build_quote(session.cart, session, currency);

    const { payments } = await get_settings();
    // Card payments return with Stripe (task 4.3); until then only PayPal and bank transfer are offered.
    const methods = ([payments.bank_transfer && "Bank Transfer", payments.paypal && "PayPal"] as const).filter((m): m is "Bank Transfer" | "PayPal" => Boolean(m));
    const payment_method = methods.find((m) => m == session.payment_method) ?? methods[0];

    const shipping_country = quote.address == "Local Pickup" ? "" : quote.address.country;

    return (
        <div className="flex justify-start items-start flex-col gap-4 w-full h-fit font-secondary">
            <Items currency={currency} lines={quote.lines} />

            {quote.unavailable.length > 0 && (
                <p role="alert" className="text-red-400 text-sm font-sans">
                    {t_errors("unavailable", { items: quote.unavailable.join(", ") })}
                </p>
            )}

            <div className="w-full flex flex-col justify-center items-start gap-4 border-b border-(--clr-gold) pb-4">
                {payments.local_pickup && <Pickup_wrapper />}
                <TotalsBreakdown totals={quote.totals} currency={currency} tax={quote.tax} pickup={quote.address == "Local Pickup"} shipping_label={t_cart("shipping_to", { country: shipping_country })} />
            </div>

            <div className="w-full text-gold">
                <h2>{t("payment")}</h2>
            </div>
            {payment_method && <Payment_Options default_option={payment_method} methods={methods} />}

            {payment_method == "Bank Transfer" && <BankTransfer />}
            {payment_method == "PayPal" && <Paypal_component currency={currency} />}

            <p className="text-shine">{t("agreement")}</p>
        </div>
    );
}
