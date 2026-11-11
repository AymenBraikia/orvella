import { getTranslations } from "next-intl/server";
import CreateOrderBtn from "@/app/components/buttons/create_order";
import type { CheckoutCustomer } from "@/app/server/cart";
import { details_complete } from "./details_complete";
import { DEMO_MODE } from "../lib/demo";

export default async function BankTransfer({ customer }: { customer: CheckoutCustomer }) {
    const t = await getTranslations("checkout");
    const t_demo = await getTranslations("demo");

    return (
        <div className="w-full flex justify-center items-start flex-col gap-4 font-sans">
            <p className="text-sm text-secondary">{t("bankNote")}</p>
            {DEMO_MODE && <p className="text-sm text-gold font-semibold">{t_demo("bankNote")}</p>}
            <CreateOrderBtn ready={details_complete(customer)} />
        </div>
    );
}
