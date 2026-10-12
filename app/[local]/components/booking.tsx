import Image from "next/image";
import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";

export default async function Booking() {
    const t = await getTranslations("intrest");
    return (
        <FadeInObserver>
            <div className={`w-full min-h-100 sm:h-125 mt-12 sm:mt-20 relative flex-center flex-col text-center text-white select-none gap-4 px-4`}>
                <Image src="/book.webp" quality={60} alt="booking.webp" sizes="(max-width: 768px) 750px, 100dvw" className="object-cover object-center select-none dark:brightness-25 not-dark:brightness-35" fill></Image>
                <p className="z-10 sm:text-5xl text-4xl tracking-wider font-primary">{t("title")}</p>
                <p className="z-10 sm:text-2xl text-sm tracking-wide leading-10 italic font-secondary sm:max-w-1/2 max-w-4/5">{t("subTitle")}</p>
                <Link aria-label={t("cta")} className="z-10 sm:text-3xl text-2xl underline italic font-primary" href={"/why"} prefetch={true}>
                    {t("cta")}
                </Link>
            </div>
        </FadeInObserver>
    );
}
