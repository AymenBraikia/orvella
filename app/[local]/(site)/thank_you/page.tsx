import Banner from "@/app/components/banner";
import getUser from "@/app/server/get_user";
import { getTranslations } from "next-intl/server";
import Order_display from "./order_display";

export default async function thank_you_page() {
    const user = (await getUser())!;
    const t = await getTranslations("orders");

    return (
        <div className="font-secondary py-8 w-full flex-center flex-col gap-12 capitalize">
            <Banner>
                <div className="flex w-full flex-col items-start gap-5 font-secondary">
                    <h1 className="leading-tight max-w-150">
                        {t("thankYou")} {user.first_name} {t("thankYouSuffix")}
                    </h1>

                    <p className="max-w-[46ch] font-sans text-sm leading-relaxed text-secondary sm:text-base">{t("subtitle")}</p>
                </div>
            </Banner>

            <div className="flex-center flex-col gap-16 w-full px-4 sm:px-12 font-sans">
                <div className="w-full">
                    <h2 className="text-shine">{t("ongoingOrders")}</h2>

                    <div className={`flex justify-start items-start flex-col w-full mt-12 overflow-x-auto ${user.ongoing_orders.length ? "bg-primary" : ""}`}>
                        <div className={`min-w-250 w-full gap-2 bg-primary ps-2 pe-5 py-6 font-semibold border-b ${user.ongoing_orders.length ? "flex justify-between items-center" : "hidden"}`}>
                            <p className="w-45">{t("orderId")}</p>
                            <p className="w-35">{t("orderDate")}</p>
                            <p className="w-25">{t("orderTotal")}</p>
                            <p className="w-35">{t("paymentMethod")}</p>
                            <p className="w-80">{t("shipping")}</p>
                            <p className="w-25">{t("status")}</p>
                        </div>

                        {user.ongoing_orders.length ? (
                            <div className="min-w-250 overflow-y-auto w-full max-h-150 h-fit flex flex-col justify-start items-start gap-4">
                                {user.ongoing_orders.map((order, i) => (
                                    <Order_display key={order.id} last={user.ongoing_orders.length == i + 1} data={order} />
                                ))}
                            </div>
                        ) : (
                            <h3 className="capitalize">{t("noOngoingOrders")}</h3>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    <h2 className="text-shine">{t("deliveredOrders")}</h2>

                    <div className={`flex-center flex-col w-full mt-12 overflow-x-auto ${user.fulfilled_orders.length ? "bg-primary" : ""}`}>
                        <div className={`min-w-250 w-full gap-2 bg-primary ps-2 pe-5 py-6 font-semibold border-b ${user.fulfilled_orders.length ? "flex justify-between items-center" : "hidden"}`}>
                            <p className="w-45">{t("orderId")}</p>
                            <p className="w-35">{t("orderDate")}</p>
                            <p className="w-25">{t("orderTotal")}</p>
                            <p className="w-35">{t("paymentMethod")}</p>
                            <p className="w-80">{t("shipping")}</p>
                            <p className="w-25">{t("status")}</p>
                        </div>

                        {user.fulfilled_orders.length ? (
                            <div className="min-w-250 overflow-y-auto w-full max-h-150 h-fit flex flex-col justify-start items-start gap-4">
                                {user.fulfilled_orders.map((o, i) => (
                                    <Order_display key={o.id} last={user.fulfilled_orders.length == i + 1} data={o} />
                                ))}
                            </div>
                        ) : (
                            <h3 className="capitalize">{t("noDeliveredOrders")}</h3>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
