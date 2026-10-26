import { getLocale, getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";
import { format_money } from "../lib/price_format";
import type { Order } from "@/types/order";

/** Where and how to pay a bank transfer order. The order number is the payment reference. */
export default async function BankDetails({ order }: { order: Order }) {
    const t = await getTranslations("orders.bank");
    const locale = await getLocale();
    const { bank } = await store_identity();

    const deadline = order.reserved_until ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(order.reserved_until)) : "";

    const rows: [string, string][] = [
        [t("accountHolder"), bank.account_holder],
        [t("bank"), bank.bank_name],
        [t("iban"), bank.iban],
        [t("bic"), bank.bic],
        [t("reference"), order.id],
        [t("amount"), format_money(order.totals.total, order.currency)],
    ];

    return (
        <div className="w-full flex flex-col gap-4 border border-gold p-4 sm:p-6 font-sans normal-case">
            <h4 className="text-gold font-secondary">{t("heading")}</h4>
            <p className="text-sm text-secondary">{t("instructions", { amount: format_money(order.totals.total, order.currency), id: order.id, date: deadline })}</p>
            <div className="flex flex-col gap-2">
                {rows.map(([label, value]) => (
                    <div key={label} className="w-full flex justify-between items-center gap-4 border-b border-secondary/30 py-1">
                        <p className="text-gold">{label}</p>
                        <p className="font-semibold text-end break-all">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
