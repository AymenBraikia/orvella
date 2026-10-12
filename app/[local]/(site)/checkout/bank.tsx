import { getTranslations } from "next-intl/server";
import { format_price } from "../lib/price_format";
import { Supported_Currencies } from "@/currency";
import { UserData } from "@/types/user";
import CreateOrderBtn from "@/app/components/buttons/create_order";

export default async function BankTransfer({ session, currency }: { session: UserData; currency: Supported_Currencies }) {
    const t = await getTranslations("checkout");

    const order = session.current_order;

    return (
        <div className="w-full flex justify-center items-start flex-col gap-4 capitalize font-sans">
            {order?.payment_method == "Bank Transfer" ? (
                <>
                    <div className="w-full flex justify-between items-center">
                        <p>{t("orderNumber")}:</p>
                        <p>{order.id}</p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>{t("orderDate")}:</p>
                        <p>{new Date(order.created_at).toDateString()}</p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>{t("orderTotal")}:</p>
                        <p>{format_price(order.amount_to_pay, currency)}</p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>{t("paymentMethod")}:</p>
                        <p>Bank Transfer</p>
                    </div>
                    <span className="w-full h-px bg-foreground"></span>
                    <div className="w-full flex justify-between items-center">
                        <p>Bank:</p>
                        <p className="font-semibold">Hamburger Sparkasse AG</p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>IBAN:</p>
                        <p className="font-semibold">DE12 1234 1234 1234 1234 12</p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>BIC:</p>
                        <p className="font-semibold">ABCDEFGHXXX</p>
                    </div>
                </>
            ) : (
                <></>
            )}
            <CreateOrderBtn />
        </div>
    );
}
