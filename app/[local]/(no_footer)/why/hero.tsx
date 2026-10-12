import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function Hero() {
    const t = await getTranslations("why");

    return (
        <section className="w-full min-h-dvh flex-center flex-col gap-5 sm:gap-10 text-center">
            <p className="text-xs sm:text-base text-shine min-w-fit whitespace-nowrap uppercase tracking-widest">{t("hero.eyebrow")}</p>

            <p className="font-primary text-2xl sm:text-3xl lg:text-4xl xl:text-5xl tracking-wider italic font-light">
                {t.rich("hero.title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <p className="text-xs sm:text-sm lg:text-base leading-6 sm:leading-8 font-thin text-secondary w-200 max-w-[90dvw] sm:max-w-[70dvw] text-center tracking-wider">{t("hero.description")}</p>

            <div className="flex-center sm:gap-8 gap-2 flex-col sm:flex-row capitalize text-sm sm:text-xl font-secondary">
                <Link href={"#gap"} className="button2">
                    {t("hero.seeDifference")}
                </Link>
                <Link href={"/"} className="button2">
                    {t("hero.openStorefront")}
                </Link>
            </div>
        </section>
    );
}
