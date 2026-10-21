import Image from "next/image";
import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";

export default async function Trade() {
    const t = await getTranslations("trade");
    return (
        <FadeInObserver>
            <div className={`w-full min-h-100 sm:h-125 mt-12 sm:mt-20 relative flex-center flex-col text-center text-white select-none gap-8 px-4 py-10 sm:py-4`}>
                <Image src="/jewelry.avif" alt="jewelry.avif" sizes="(max-width: 768px) 750px, 100dvw" className="object-cover object-center select-none dark:brightness-25 not-dark:brightness-35" fill></Image>

                <p className="z-10 sm:text-2xl tracking-wider font-primary uppercase text-gold font-bold">{t("heading")}</p>

                <p className="z-10 sm:text-5xl text-2xl tracking-wide leading-10 italic font-primary sm:max-w-full max-w-4/5">{t("subHeading")}</p>
                <p className="z-10 text-base tracking-wider leading-10 font-normal font-secondary sm:max-w-1/2 max-w-4/5">{t("subText")}</p>

                <div className="flex-col sm:flex-row flex-center gap-4">
                    <Link aria-label={t("cta1")} className="z-10 sm:text-xl text-base font-normal sm:font-thin font-sans button3 bg-gold hover:bg-white hover:text-black uppercase tracking-widest" href={"/why"} prefetch={true}>
                        {t("cta1")}
                    </Link>

                    <Link aria-label={t("cta2")} className="z-10 sm:text-xl text-base font-normal sm:font-thin font-sans button3 hover:bg-white hover:text-black  uppercase tracking-widest" href={"/why"} prefetch={true}>
                        {t("cta2")}
                    </Link>
                </div>
            </div>
        </FadeInObserver>
    );
}
