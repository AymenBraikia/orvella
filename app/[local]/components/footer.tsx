"use client";
import Link from "next/link";
import FooterView, { FooterColumn } from "./footer_view";
import Instagram from "./svg/instagram";
import Watch from "./svg/watch";
import Ebay from "./svg/ebay";
import { useTranslations } from "next-intl";
import WhatsApp from "./svg/whatsapp";
import type { PublicStoreDetails } from "@/types/settings";

export default function Footer({ store }: { store: PublicStoreDetails }) {
    const t = useTranslations("common.footer");
    const t_nav = useTranslations("common.nav");

    const platforms = [
        { href: store.chrono24_url, label: "Chrono 24", icon: <Watch classnames={"w-6"} /> },
        { href: store.ebay_url, label: "Ebay", icon: <Ebay classnames={"w-6"} /> },
        { href: store.whatsapp ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` : "", label: "WhatsApp", icon: <WhatsApp classnames={"w-6"} /> },
        { href: store.instagram_url, label: "Instagram", icon: <Instagram classnames={"w-6"} /> },
    ].filter((p) => p.href);

    return (
        <FooterView
            name={store.store_name}
            details={
                <ul className="flex flex-col justify-start items-start gap-2 tracking-wider">
                    {store.address.street ? (
                        <>
                            <li>{store.address.street}</li>
                            <li>
                                {store.address.postcode} {store.address.city}
                            </li>
                            <li>{store.address.country}</li>
                        </>
                    ) : (
                        <li>
                            <Link href="/booking" className="underline text-secondary hover:text-primary transition-default">
                                {t("byAppointment")}
                            </Link>
                        </li>
                    )}
                    {store.phone && (
                        <li>
                            <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`}>{store.phone}</a>
                        </li>
                    )}
                    {store.email && (
                        <li>
                            <a href={`mailto:${store.email}`}>{store.email}</a>
                        </li>
                    )}
                </ul>
            }
            bottom={
                <>
                    <p className="">{t("disclaimerText")}</p>
                    <p className="">{t("copyright", { year: new Date().getFullYear() })}</p>
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
                </>
            }
        >
            <FooterColumn heading={t("shopHeading")}>
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
            </FooterColumn>
            <FooterColumn heading={t("serviceHeading")}>
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
            </FooterColumn>
            {/* Only the profiles the store has filled in under Admin → Settings */}
            {platforms.length > 0 && (
                <FooterColumn heading={t("otherPlatformsHeading")}>
                    {platforms.map((p) => (
                        <li key={p.label}>
                            <Link target={"_blank"} rel="noreferrer" aria-label={p.label} href={p.href} className="underline flex justify-start items-center gap-4 text-secondary hover:text-primary transition-default">
                                {p.icon}
                                <p>{p.label}</p>
                            </Link>
                        </li>
                    ))}
                </FooterColumn>
            )}
            <FooterColumn heading={t("legalHeading")}>
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
            </FooterColumn>
        </FooterView>
    );
}
