import { getTranslations } from "next-intl/server";
import PayPal_Btn from "../[local]/components/buttons/paypal";
import { Supported_Currencies } from "@/currency";

export default async function Paypal_component({ currency }: { currency: Supported_Currencies }) {
    const t = await getTranslations("checkout");

    return (
        <div className="w-full">
            <PayPal_Btn currency={currency} disabled={false} />
            <p className="w-full">
                {t("paypalNote")} <br /> <br /> <span className="text-gold">{t("email")}: </span> <span className="font-semibold font-sans">test@orvella.com</span>
                <br /> <span className="text-gold">{t("password")}: </span> <span className="font-semibold font-sans">Arvell_123</span>
            </p>
        </div>
    );
}
