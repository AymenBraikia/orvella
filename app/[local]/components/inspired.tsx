import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";

export default async function Inspired() {
    const t = await getTranslations("home");
    const t_btn = await getTranslations("common.buttons");

    return (
        <FadeInObserver>
            <div className="px-4 py-12 flex-center flex-col md:flex-row min-h-100 gap-5 md:h-50 md:gap-20 overflow-hidden text-center relative">
                <p className="text-4xl sm:text-6xl tracking-wider w-full sm:w-1/2 font-secondary">{t("getInspiredHeading")}</p>
                <div className="md:h-full md:w-0.5 w-full h-1 bg-foreground"></div>
                <div className="text-xl flex flex-col gap-8 h-1/2 font-secondary w-full sm:w-1/2">
                    <p className="sm:max-w-100 w-full wrap-break-word tracking-wide leading-8 text-shine">{t("getInspiredSubtext")}</p>
                    <Link aria-label="Begin your journey" className="underline text-shine w-full max-w-100 italic" href={"/shop"} prefetch={true}>
                        {t_btn("begin")}
                    </Link>
                </div>
            </div>
        </FadeInObserver>
    );
}
