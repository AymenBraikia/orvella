import { getTranslations } from "next-intl/server";
import PayPal_Btn from "../[local]/components/buttons/paypal";
import { Supported_Currencies } from "@/currency";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

export default async function Paypal_component({ currency, ready }: { currency: Supported_Currencies; ready: boolean }) {
    const t = await getTranslations("checkout");
    const t_demo = await getTranslations("demo");

    return (
        <div className="w-full flex flex-col gap-2">
            {!ready && <p className="text-sm text-red-400">{t("errors.details")}</p>}
            <PayPal_Btn currency={currency} disabled={!ready} />
            {/* The demo always runs on the PayPal sandbox; show the test login there only. */}
            {DEMO_MODE && (
                <p className="w-full text-sm">
                    <span className="text-gold font-semibold">{t_demo("testPayment")}</span> {t("paypalNote")}
                    <br /> <span className="text-gold">{t("email")}: </span> <span className="font-semibold font-sans">test@orvella.com</span>
                    <br /> <span className="text-gold">{t("password")}: </span> <span className="font-semibold font-sans">Arvell_123</span>
                </p>
            )}
        </div>
    );
}
