import { Order } from "@/types/order";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { format_money } from "../lib/price_format";

export default async function Order_display({ data, last }: { data: Order; last: boolean }) {
    const t = await getTranslations("orders");
    const t_checkout = await getTranslations("checkout");
    const { totals, currency, tax } = data;

    const address = typeof data.address == "string" ? t("localPickup") : `${data.address.city}, ${data.address.address1 + (data.address.address2 ? `, ${data.address.address2}` : "")}`;

    return (
        <div key={data.id} className={`flex-center flex-col min-w-250 w-full ${last ? "" : "border-b"} tracking-wide gap-4`}>
            <div className="w-full flex justify-between items-center gap-2 bg-secondary p-2">
                <p className="w-45 font-sans">{data.id}</p>

                <p className="w-35">{new Date(data.created_at).toDateString()}</p>

                <p className="w-25">{format_money(data.totals.total, data.currency)}</p>

                <p className="w-35">{data.payment_method}</p>

                <span className="w-80">
                    <p>{address}</p>

                    {data.shipping && <p className="text-sm text-secondary">{data.shipping.carrier}</p>}
                    {data.tracking && (
                        <p className="text-sm text-secondary">
                            {data.tracking.carrier} · {data.tracking.number}
                        </p>
                    )}
                </span>

                <p className="w-25">{t(`statuses.${data.status}`)}</p>
            </div>

            <div className="w-full flex justify-start items-start flex-wrap gap-4 h-full p-2">
                {data.items.map((item) => (
                    <div className="flex justify-start items-start gap-4 w-[calc(33%-12px)] h-25" key={item.slug}>
                        <div className="relative h-full aspect-square">{item.image && <Image fill src={item.image} alt={item.name} sizes="(max-width: 768px) 80vw, 300px" className="object-cover object-center" />}</div>

                        <div className="w-full h-full flex flex-col justify-between items-start tracking-wider">
                            <h6 className="capitalize font-thin">{item.name}</h6>

                            <p className="text-xl">
                                {item.quantity}x · {format_money(item.unit_price, data.currency)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full flex flex-wrap justify-end items-center gap-x-8 gap-y-1 px-2 pb-4 text-sm text-secondary">
                <p>
                    {t_checkout("subtotal")}: {format_money(totals.items, currency)}
                </p>
                <p>
                    {t_checkout("shippingCost")}: {format_money(totals.shipping, currency)}
                </p>
                {totals.discount > 0 && (
                    <p>
                        {t_checkout("discount")}: - {format_money(totals.discount, currency)}
                    </p>
                )}
                {tax.mode == "added" && (
                    <p>
                        {t_checkout("vatAdded", { rate: tax.rate })}: {format_money(totals.tax, currency)}
                    </p>
                )}
                {tax.mode == "included" && totals.tax_included > 0 && (
                    <p>
                        {t_checkout("vatIncluded", { rate: tax.rate })}: {format_money(totals.tax_included, currency)}
                    </p>
                )}
                {tax.mode == "margin_scheme" && <p>{t_checkout("marginScheme")}</p>}
                <p className="text-foreground font-semibold">
                    {t_checkout("total")}: {format_money(totals.total, currency)}
                </p>
            </div>
        </div>
    );
}
