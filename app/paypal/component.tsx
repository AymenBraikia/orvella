import { getTranslations } from "next-intl/server";
import PayPal_Btn from "../[local]/components/buttons/paypal";
import { Supported_Currencies } from "@/currency";

export default async function Paypal_component({ currency }: { currency: Supported_Currencies }) {
    const t = await getTranslations("checkout");

    return (
        <div className="w-full">
            <PayPal_Btn currency={currency} disabled={false} />
            <p className="w-full">
                {t("paypalNote")} <br /> <br /> <span className="text-shine">{t("email")}: </span> <span className="font-semibold">test@arvell.com</span>
                <br /> <span className="text-shine">{t("password")}: </span> <span className="font-semibold">Arvell_123</span>
            </p>
        </div>
    );
}
