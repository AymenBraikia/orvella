import { getTranslations } from "next-intl/server";
import PayPal_Btn from "../[local]/components/buttons/paypal";
import { Supported_Currencies } from "@/currency";

export default async function Paypal_component({ currency, ready }: { currency: Supported_Currencies; ready: boolean }) {
    const t = await getTranslations("checkout");

    return (
        <div className="w-full">
            {!ready && <p className="text-sm text-red-400 mb-2">{t("errors.details")}</p>}
            <PayPal_Btn currency={currency} disabled={!ready} />
            <p className="w-full">
                {t("paypalNote")} <br /> <br /> <span className="text-gold">{t("email")}: </span> <span className="font-semibold font-sans">test@orvella.com</span>
                <br /> <span className="text-gold">{t("password")}: </span> <span className="font-semibold font-sans">Arvell_123</span>
            </p>
        </div>
    );
}
