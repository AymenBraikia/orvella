import { getTranslations } from "next-intl/server";
import CreateOrderBtn from "@/app/components/buttons/create_order";

export default async function BankTransfer() {
    const t = await getTranslations("checkout");

    return (
        <div className="w-full flex justify-center items-start flex-col gap-4 font-sans">
            <p className="text-sm text-secondary">{t("bankNote")}</p>
            <CreateOrderBtn />
        </div>
    );
}
