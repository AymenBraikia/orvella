import Item_Display from "./item_display";

import shipping_data from "@/app/shipping.json";

import Link from "next/link";

import { format_price } from "../lib/price_format";
import { Supported_Currencies } from "@/currency";

import getUser from "@/app/server/get_user";
import { getTranslations } from "next-intl/server";
import { get_Currency } from "../lib/get_currency";
import Select_country from "@/app/components/shipping_related/select_country";
import LocalPickup_checkbox from "@/app/components/shipping_related/localPickup";

export default async function Items() {
    const session = await getUser();
    const t = await getTranslations("cart");

    if (!session) return;

    const total = session.cart.reduce((prev, current) => prev + current.price * current.quantity, 0);

    const pickup = session.local_pickup;

    const country = session.address.country || "Germany";
    const shipping_costs = session.address.shipping_costs || shipping_data.DE.shipping_cost;

    const currency = (await get_Currency()) as Supported_Currencies;

    return (
        <div className="w-full h-fit flex xl:flex-row flex-col justify-between items-start gap-12 xl:gap-4">
            {session!.cart.length ? (
                <>
                    <div className=" xl:min-w-190 w-full h-full max-h-[75dvh] overflow-y-auto overflow-x-hidden flex justify-start items-start flex-col gap-4 pe-2">
                        {session!.cart.map((i) => (
                            <Item_Display key={i.slug} {...i} />
                        ))}
                    </div>
                    <div className="xl:max-w-125 min-w-100 h-fit w-full bg-background font-secondary flex flex-col justify-start items-start px-4 gap-8">
                        <h1 className="font-semibold text-gold">{t("summary")}</h1>

                        <div className="flex justify-between items-center w-full border-b py-1">
                            <h4 className="text-gold">{t("subtotal")}</h4>
                            <h4>{format_price(total, currency)}</h4>
                        </div>

                        <div className="flex flex-col justify-center items-start w-full border-b gap-4 py-1">
                            <h4 className={`${pickup ? "line-through" : ""} text-gold`}>{t("shipping")}</h4>
                            <div className="flex justify-between items-center w-full gap-4">
                                <div className="flex flex-col justify-start items-start gap-2 text-sm xl:text-base">
                                    <p>{t("shipping_to", { country })}</p>
                                    <Select_country />
                                </div>
                                <p className={`xl:flex hidden ${pickup ? "line-through" : ""}`}>{format_price(shipping_costs, currency)}</p>
                            </div>

                            <p className={`xl:hidden flex ${pickup ? "line-through" : ""}`}>{t("shipping_costs", { cost: format_price(shipping_costs, currency) })}</p>

                            <LocalPickup_checkbox />

                            <p className="text-sm text-secondary">
                                {t("moreAbout")}{" "}
                                <Link href="/info/payments" className="underline text-foreground">
                                    {t("shipping")}
                                </Link>
                            </p>
                        </div>

                        <div className="flex justify-between items-center w-full border-b py-1 text-gold">
                            <h2>{t("total")}</h2>
                            <h2>{format_price(total + (pickup ? 0 : shipping_costs), currency)}</h2>
                        </div>

                        <div className="flex justify-between items-center w-full py-1">
                            <Link href={"/checkout"} className="button3 text-primary bg-gold hover:bg-background hover:text-gold w-full flex-center text-xl">
                                {t("checkoutCta")}
                            </Link>
                        </div>
                    </div>
                </>
            ) : (
                <h1>{t("empty")}</h1>
            )}
        </div>
    );
}
