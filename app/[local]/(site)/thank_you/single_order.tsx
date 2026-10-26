import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { format_money } from "../lib/price_format";
import TotalsBreakdown from "../checkout/totals";
import BankDetails from "./bank_details";
import type { Order } from "@/types/order";

/** One order, as the customer sees it right after buying (also reachable by guests through the access link). */
export default async function SingleOrder({ order, offer_account }: { order: Order; offer_account: boolean }) {
    const t = await getTranslations("orders");
    const t_cart = await getTranslations("cart");

    const address = order.address == "Local Pickup" ? t("localPickup") : [order.address.address1, order.address.address2, `${order.address.postCode} ${order.address.city}`, order.address.country].filter(Boolean).join(", ");
    const waiting_for_transfer = order.status == "pending_payment" && order.payment_method == "Bank Transfer";

    const next_step = waiting_for_transfer ? null : order.status == "pending_payment" ? t("nextSteps.processing") : order.status == "paid" ? t("nextSteps.paid") : order.status == "shipped" ? t("nextSteps.shipped") : null;

    return (
        <div className="w-full flex flex-col gap-10 font-sans normal-case">
            <div className="flex flex-wrap gap-x-10 gap-y-2 text-sm">
                <p>
                    <span className="text-secondary">{t("orderId")}: </span>
                    <span className="font-semibold">{order.id}</span>
                </p>
                <p>
                    <span className="text-secondary">{t("orderDate")}: </span>
                    {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p>
                    <span className="text-secondary">{t("status")}: </span>
                    <span className="text-gold">{t(`statuses.${order.status}`)}</span>
                </p>
                <p>
                    <span className="text-secondary">{t("paymentMethod")}: </span>
                    {order.payment_method}
                </p>
            </div>

            {waiting_for_transfer && <BankDetails order={order} />}
            {next_step && <p className="border border-gold p-4 text-sm">{next_step}</p>}
            {order.tracking && (
                <p className="text-sm">
                    {order.tracking.carrier} · {order.tracking.number}
                </p>
            )}

            <div className="w-full flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-3/5 flex flex-col gap-4">
                    {order.items.map((item) => (
                        <div key={item.slug} className="flex items-center gap-4 border-b border-secondary/30 pb-4">
                            <div className="relative w-20 h-20 shrink-0 bg-primary">{item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}</div>
                            <div className="flex-1 min-w-0">
                                <Link href={`/product/${item.slug}`} className="font-secondary text-lg capitalize hover:underline">
                                    {item.name}
                                </Link>
                                {item.reference && <p className="text-xs text-secondary">Ref. {item.reference}</p>}
                                <p className="text-sm text-secondary">
                                    {item.quantity} × {format_money(item.unit_price, order.currency)}
                                </p>
                            </div>
                            <p className="tabular-nums">{format_money(item.total, order.currency)}</p>
                        </div>
                    ))}
                    <p className="text-sm">
                        <span className="text-secondary">{t("shipping")}: </span>
                        {address}
                    </p>
                </div>

                <div className="w-full lg:w-2/5 font-secondary">
                    <TotalsBreakdown totals={order.totals} currency={order.currency} tax={order.tax} pickup={order.address == "Local Pickup"} shipping_label={t_cart("shipping")} />
                </div>
            </div>

            {offer_account && (
                <div className="w-full flex flex-col gap-3 border border-secondary/40 p-6">
                    <h4 className="font-secondary">{t("createAccount.heading")}</h4>
                    <p className="text-sm text-secondary">{t("createAccount.text")}</p>
                    <Link
                        href={`/auth/sign_up?email=${encodeURIComponent(order.email)}&order=${encodeURIComponent(order.id)}&token=${order.access_token}&redirect=${encodeURIComponent("/thank_you")}`}
                        className="button3 bg-gold text-primary w-fit px-6! py-3!"
                    >
                        {t("createAccount.cta")}
                    </Link>
                </div>
            )}
        </div>
    );
}
