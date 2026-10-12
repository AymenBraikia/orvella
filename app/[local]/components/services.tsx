import Image from "next/image";
import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";

export default async function Services() {
    const t = await getTranslations("home");
    return (
        <FadeInObserver>
            <div className={`w-full h-fit flex-center gap-8 flex-col lg:flex-row p-4 py-20 md:p-20 lg:py-0`}>
                <Link aria-label="sell or consign" href={"/sell"} className="md:max-w-150 lg:min-w-1/3 aspect-square w-full flex flex-col justify-start items-start relative">
                    <div className="relative w-full h-full transition hover:brightness-100 brightness-75 transition-default overflow-hidden group">
                        <Image sizes="(max-width: 1200px) 100vw, 70vw" src="/sell.webp" fill alt="Sell / Consign" className="object-cover object-center select-none" />
                    </div>
                    <div className="absolute inset-s-4 bottom-4 flex flex-col p-2 text-white">
                        <p className="lg:title4 md:title5 title6 font-primary italic">{t("sellConsignCard.title")}</p>
                        <p className="underline italic font-secondary">{t("sellConsignCard.cta")}</p>
                    </div>
                </Link>
                <Link aria-label="spare parts" href={"/spare"} className="md:max-w-150 lg:min-w-1/3 aspect-square w-full flex flex-col justify-start items-start relative">
                    <div className="relative w-full h-full transition hover:brightness-100 brightness-75 transition-default overflow-hidden group">
                        <Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" src="/spare.webp" fill alt="Sell / Consign" className="object-cover object-center select-none" />
                    </div>
                    <div className="absolute inset-s-4 bottom-4 flex flex-col p-2 text-white">
                        <p className="lg:title4 md:title5 title6 font-primary italic">{t("sparePartsCard.title")}</p>
                        <p className="underline italic font-secondary">{t("sparePartsCard.cta")}</p>
                    </div>
                </Link>
                <Link aria-label="polishing and services" href={"/polish"} className="md:max-w-150 lg:min-w-1/3 aspect-square w-full flex flex-col justify-start items-start relative">
                    <div className="relative w-full h-full transition hover:brightness-100 brightness-75 transition-default overflow-hidden group">
                        <Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" src="/polish.webp" fill alt="Sell / Consign" className="object-cover object-center select-none" />
                    </div>
                    <div className="absolute inset-s-4 bottom-4 flex flex-col p-2 text-white">
                        <p className="lg:title4 md:title5 title6 font-primary italic">{t("polishCard.title")}</p>
                        <p className="underline italic font-secondary">{t("polishCard.cta")}</p>
                    </div>
                </Link>
            </div>
        </FadeInObserver>
    );
}
