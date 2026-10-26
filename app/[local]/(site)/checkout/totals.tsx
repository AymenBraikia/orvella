import { getTranslations } from "next-intl/server";
import { format_money } from "../lib/price_format";
import type { OrderTotals, TaxMode } from "@/types/order";

/** Subtotal / shipping / tax / total, shared by cart, checkout and order pages. */
export default async function TotalsBreakdown({
    totals,
    currency,
    tax,
    shipping_label,
    pickup,
}: {
    totals: OrderTotals;
    currency: string;
    tax: { mode: TaxMode; rate: number };
    shipping_label: string;
    pickup: boolean;
}) {
    const t = await getTranslations("checkout");
    const t_cart = await getTranslations("cart");

    return (
        <div className="w-full flex flex-col justify-center items-start gap-4 tracking-wider">
            <div className="w-full flex justify-between items-center border-b text-gold">
                <h5>{t("subtotal")}</h5>
                <h5>{format_money(totals.items, currency)}</h5>
            </div>

            <div className="w-full flex justify-between items-center">
                <p>{pickup ? t_cart("localPickup") : shipping_label}</p>
                <p>{format_money(totals.shipping, currency)}</p>
            </div>

            {totals.discount > 0 && (
                <div className="w-full flex justify-between items-center">
                    <p>{t("discount")}</p>
                    <p>- {format_money(totals.discount, currency)}</p>
                </div>
            )}

            {tax.mode == "added" && (
                <div className="w-full flex justify-between items-center">
                    <p>{t("vatAdded", { rate: tax.rate })}</p>
                    <p>{format_money(totals.tax, currency)}</p>
                </div>
            )}

            <div className="w-full flex justify-between items-center text-gold border-t pt-2">
                <h5>{t_cart("total")}</h5>
                <h5>{format_money(totals.total, currency)}</h5>
            </div>

            {tax.mode == "included" && (
                <p className="w-full text-end text-sm text-secondary">
                    {t("vatIncluded", { rate: tax.rate })}: {format_money(totals.tax_included, currency)}
                </p>
            )}
            {tax.mode == "margin_scheme" && <p className="w-full text-end text-sm text-secondary">{t("marginScheme")}</p>}
        </div>
    );
}
