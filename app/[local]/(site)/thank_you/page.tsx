import Banner from "@/app/components/banner";
import getUser from "@/app/server/get_user";
import { getLocale, getTranslations } from "next-intl/server";
import Order_display from "./order_display";
import Link from "next/link";
import { order_by_token, orders_for_email } from "@/app/server/orders";
import BankDetails, { transfer_deadline } from "./bank_details";
import SingleOrder from "./single_order";
import { format_money } from "../lib/price_format";
import type { Order } from "@/types/order";

/** The hero only says "confirmed" once the money is in. */
async function hero_copy(order: Order | null, name: string) {
    const t = await getTranslations("orders");

    if (order?.status == "pending_payment" && order.payment_method == "Bank Transfer") {
        const text = t("reservedText", { amount: format_money(order.totals.total, order.currency), date: transfer_deadline(order, await getLocale()), id: order.id });
        return { title: t("reservedTitle", { name }), text };
    }
    if (order?.status == "pending_payment") return { title: t("processingTitle", { name }), text: t("nextSteps.processing") };
    if (order?.status == "paid" || order?.status == "shipped" || order?.status == "delivered") return { title: `${t("thankYou")} ${name} ${t("thankYouSuffix")}`, text: t("subtitle"), confirmed: true };

    return { title: t("plainTitle", { name }) };
}

export default async function thank_you_page({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
    const { order: order_id, token } = await searchParams;
    const user = await getUser();
    const t = await getTranslations("orders");

    // The order just placed (or opened from an email) — by its private link, so guests see it too.
    const single = order_id && token ? await order_by_token(order_id, token) : null;

    if (!user && !single) {
        return (
            <div className="font-secondary py-20 w-full flex-center flex-col gap-6 text-center px-4">
                <h2>{t("notFound")}</h2>
                <Link href="/shop" className="underline">
                    {t("browse")}
                </Link>
            </div>
        );
    }

    const orders = user ? (await orders_for_email(user.email)).filter((o) => o.id != single?.id) : [];
    const ongoing_orders = orders.filter((o) => o.status == "pending_payment" || o.status == "paid" || o.status == "shipped");
    const fulfilled_orders = orders.filter((o) => o.status == "delivered");
    const awaiting_transfer = orders.filter((o) => o.status == "pending_payment" && o.payment_method == "Bank Transfer");
    const hero = await hero_copy(single, single?.first_name ?? user?.first_name ?? "");

    return (
        <div className="font-secondary py-8 w-full flex-center flex-col gap-12">
            <Banner>
                <div className="flex w-full flex-col items-start gap-5 font-secondary">
                    <h1 className={`leading-tight max-w-150 ${hero.confirmed ? "capitalize" : ""}`}>{hero.title}</h1>

                    {hero.text && <p className="max-w-[46ch] font-sans text-sm leading-relaxed text-secondary sm:text-base">{hero.text}</p>}
                </div>
            </Banner>

            <div className="flex-center flex-col gap-16 w-full px-4 sm:px-12 font-sans">
                {single && <SingleOrder order={single} offer_account={Boolean(single.guest) && !user} />}

                {awaiting_transfer.map((order) => (
                    <BankDetails key={order.id} order={order} />
                ))}

                {user && (
                    <>
                    <div className="w-full">
                        <h2 className="text-shine capitalize">{t("ongoingOrders")}</h2>

                        <div className={`flex justify-start items-start flex-col w-full mt-12 overflow-x-auto ${ongoing_orders.length ? "bg-primary" : ""}`}>
                            <div className={`min-w-250 w-full gap-2 bg-primary ps-2 pe-5 py-6 font-semibold border-b ${ongoing_orders.length ? "flex justify-between items-center" : "hidden"}`}>
                                <p className="w-45">{t("orderId")}</p>
                                <p className="w-35">{t("orderDate")}</p>
                                <p className="w-25">{t("orderTotal")}</p>
                                <p className="w-35">{t("paymentMethod")}</p>
                                <p className="w-80">{t("shipping")}</p>
                                <p className="w-25">{t("status")}</p>
                            </div>

                            {ongoing_orders.length ? (
                                <div className="min-w-250 overflow-y-auto w-full max-h-150 h-fit flex flex-col justify-start items-start gap-4">
                                    {ongoing_orders.map((order, i) => (
                                        <Order_display key={order.id} last={ongoing_orders.length == i + 1} data={order} />
                                    ))}
                                </div>
                            ) : (
                                <h3 className="capitalize">{t("noOngoingOrders")}</h3>
                            )}
                        </div>
                    </div>

                    <div className="w-full">
                        <h2 className="text-shine capitalize">{t("deliveredOrders")}</h2>

                        <div className={`flex-center flex-col w-full mt-12 overflow-x-auto ${fulfilled_orders.length ? "bg-primary" : ""}`}>
                            <div className={`min-w-250 w-full gap-2 bg-primary ps-2 pe-5 py-6 font-semibold border-b ${fulfilled_orders.length ? "flex justify-between items-center" : "hidden"}`}>
                                <p className="w-45">{t("orderId")}</p>
                                <p className="w-35">{t("orderDate")}</p>
                                <p className="w-25">{t("orderTotal")}</p>
                                <p className="w-35">{t("paymentMethod")}</p>
                                <p className="w-80">{t("shipping")}</p>
                                <p className="w-25">{t("status")}</p>
                            </div>

                            {fulfilled_orders.length ? (
                                <div className="min-w-250 overflow-y-auto w-full max-h-150 h-fit flex flex-col justify-start items-start gap-4">
                                    {fulfilled_orders.map((o, i) => (
                                        <Order_display key={o.id} last={fulfilled_orders.length == i + 1} data={o} />
                                    ))}
                                </div>
                            ) : (
                                <h3 className="capitalize">{t("noDeliveredOrders")}</h3>
                            )}
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
