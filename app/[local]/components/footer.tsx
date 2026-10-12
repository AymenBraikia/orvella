"use client";
import Link from "next/link";
import Instagram from "./svg/instagram";
import Watch from "./svg/watch";
import Ebay from "./svg/ebay";
import { useTranslations } from "next-intl";
import WhatsApp from "./svg/whatsapp";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function Footer() {
    const t = useTranslations("common.footer");
    const t_nav = useTranslations("common.nav");

    const params = useSearchParams();

    return (
        <footer className="w-full py-8 md:px-15 lg:px-20 px-4 flex-center flex-col bg-background font-bold z-30">
            <section className="w-full lg:h-75 lg:flex-row flex-col flex justify-between lg:items-center items-start">
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <div className="relative w-40 aspect-19/4">
                        <Image src={"/logo_horizontal_light.png"} sizes="300px" alt={params.get("ref") || "Arvell"} fill className={`object-cover object-center bright-img`} />
                    </div>
                    <ul className="flex flex-col justify-start items-start gap-2 tracking-wider">
                        <li>Marie-Curie-Straße 14</li>
                        <li>60439 Frankfurt am Main</li>
                        <li>Germany</li>
                        <li>+49 30 2312 5100</li>
                        <li>info@{params.get("ref") || "arvell"}.com</li>
                    </ul>
                </div>
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <h5 className="lg:title5 title4 font-primary">{t("shopHeading")}</h5>
                    <ul className="flex flex-col justify-start items-start gap-2">
                        <li>
                            <Link aria-label="watches" href={"/shop"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("watches")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="spare parts" href={"/spare"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("spareParts")}
                            </Link>
                        </li>

                        <li>
                            <Link aria-label="about us" href={"/info/about"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("aboutUs")}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <h5 className="lg:title5 title4 font-primary">{t("serviceHeading")}</h5>
                    <ul className="flex flex-col justify-start items-start gap-2">
                        <li>
                            <Link aria-label="store" href={"/store"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("store")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="sell or consign" href={"/sell"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("sellConsign")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="polishing and services" href={"/polish"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("polishingServices")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="shipping and payments" href={"/info/payments"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("shippingPayments")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="Frequently Asked Questions" href={"/info/faq"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("faq")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="Vacancies" href={"/info/vacancies"} className="underline text-secondary hover:text-primary transition-default">
                                {t_nav("vacancies")}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <h5 className="lg:title5 title4 font-primary">{t("otherPlatformsHeading")}</h5>
                    <ul className="flex flex-col justify-start items-start gap-2">
                        <li>
                            <Link target={"_blank"} aria-label="visit chrono 24" href={"https://www.chrono24.com"} className="underline flex justify-start items-center gap-4 text-secondary hover:text-primary transition-default">
                                {<Watch classnames={"w-6"} />}
                                <p>Chrono 24</p>
                            </Link>
                        </li>
                        <li>
                            <Link target={"_blank"} aria-label="ebay store" href={"https://www.ebay.com"} className="underline flex justify-start items-center gap-4 text-secondary hover:text-primary transition-default">
                                {<Ebay classnames={"w-6"} />}
                                <p>Ebay</p>
                            </Link>
                        </li>
                        <li>
                            <Link target={"_blank"} aria-label="WhatsApp" href={"https://wa.me/213559078448"} className="underline flex justify-start items-center gap-4 text-secondary hover:text-primary transition-default">
                                {<WhatsApp classnames={"w-6"} />}
                                <p>WhatsApp</p>
                            </Link>
                        </li>
                        <li>
                            <Link target={"_blank"} aria-label="instagram page" href={"https://www.instagram.com/ayme.n0412/"} className="underline flex justify-start items-center gap-4 text-secondary hover:text-primary transition-default">
                                {<Instagram classnames={"w-6"} />}
                                <p>Instagram</p>
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <h5 className="lg:title5 title4 font-primary">{t("legalHeading")}</h5>
                    <ul className="flex flex-col justify-start items-start gap-2">
                        <li>
                            <Link aria-label="imprint" href={"/info/imprint"} className="underline text-secondary hover:text-primary transition-default">
                                {t("imprint")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="privacy policiy" href={"/info/policy"} className="underline text-secondary hover:text-primary transition-default">
                                {t("privacyPolicy")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="terms of use" href={"/info/terms"} className="underline text-secondary hover:text-primary transition-default">
                                {t("terms")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="withdrawal" href={"/info/withdraw"} className="underline text-secondary hover:text-primary transition-default">
                                {t("withdrawal")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="disclaimer" href={"/info/disclaimer"} className="underline text-secondary hover:text-primary transition-default">
                                {t("disclaimer")}
                            </Link>
                        </li>
                        <li>
                            <Link aria-label="cookies policy" href={"/info/cookies"} className="underline text-secondary hover:text-primary transition-default">
                                {t("cookiePolicy")}
                            </Link>
                        </li>
                    </ul>
                </div>
            </section>
            <section className="w-full lg:gap-0 gap-4 flex-col lg:flex-row flex justify-between items-center font-normal text-xs lg:tracking-normal tracking-wider">
                <p className="">{t("disclaimerText")}</p>
                <p className="">{t("copyright", { year: 2026 })}</p>
                <div className="flex-center flex-wrap gap-4 lg:gap-3">
                    <Link aria-label="imprint" href={"/info/imprint"} className="underline text-secondary hover:text-primary transition-default">
                        {t("imprint")}
                    </Link>
                    <Link aria-label="privacy policy" href={"/info/policy"} className="underline text-secondary hover:text-primary transition-default">
                        {t("privacyPolicy")}
                    </Link>
                    <Link aria-label="terms of use" href={"/info/terms"} className="underline text-secondary hover:text-primary transition-default">
                        {t("terms")}
                    </Link>
                    <Link aria-label="withdrawal" href={"/info/withdraw"} className="underline text-secondary hover:text-primary transition-default">
                        {t("withdrawal")}
                    </Link>
                    <Link aria-label="disclaimer" href={"/info/disclaimer"} className="underline text-secondary hover:text-primary transition-default">
                        {t("disclaimer")}
                    </Link>
                    <Link aria-label="cookies policy" href={"/info/cookies"} className="underline text-secondary hover:text-primary transition-default">
                        {t("cookiePolicy")}
                    </Link>
                </div>
            </section>
        </footer>
    );
}
