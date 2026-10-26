import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";

export default async function Inspired() {
    const t = await getTranslations("home");

    return (
        <FadeInObserver>
            <div className="px-4 py-12 flex-center flex-col md:flex-row min-h-100 gap-5 md:h-50 md:gap-20 overflow-hidden text-center relative">
                <h1 className="tracking-wider w-full sm:w-1/2 font-secondary">{t("getInspiredHeading")}</h1>
                <div className="md:h-full md:w-1 w-full h-px sm:h-1 bg-gold"></div>
                <div className="text-xl flex flex-col gap-8 h-1/2 font-secondary w-full sm:w-1/2">
                    <p className="sm:max-w-150 w-full wrap-break-word tracking-wide leading-8 text-primary">{t("getInspiredSubtext")}</p>

                    <Link aria-label={t("getInspiredCTA")} className="underline w-full sm:max-w-150 text-gold" href={"/consultation"} prefetch={true}>
                        {t("getInspiredCTA")}
                    </Link>
                </div>
            </div>
        </FadeInObserver>
    );
}
