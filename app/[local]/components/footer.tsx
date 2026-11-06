"use client";
import Link from "next/link";
import FooterView, { FooterColumn } from "./footer_view";
import Instagram from "./svg/instagram";
import Watch from "./svg/watch";
import Ebay from "./svg/ebay";
import { useTranslations } from "next-intl";
import WhatsApp from "./svg/whatsapp";
import type { PublicStoreDetails } from "@/types/settings";
import { useStorefront } from "../(site)/context/storefrontContext";

const LINK = "underline text-secondary hover:text-primary transition-default";

type FooterLink = { href: string; label: string; aria: string };

export default function Footer({ store }: { store: PublicStoreDetails }) {
    const t = useTranslations("common.footer");
    const t_nav = useTranslations("common.nav");
    const t_filters = useTranslations("common.filters");
    // A lead demo: its logo, only its own pages (under its address) and its private-demo note.
    const { demo, href, has } = useStorefront();
    const only_ours = (links: FooterLink[]) => links.filter((l) => has(l.href)).map((l) => ({ ...l, href: href(l.href) }));

    const platforms = [
        { href: store.chrono24_url, label: "Chrono 24", icon: <Watch classnames={"w-6"} /> },
        { href: store.ebay_url, label: "Ebay", icon: <Ebay classnames={"w-6"} /> },
        { href: store.whatsapp ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` : "", label: "WhatsApp", icon: <WhatsApp classnames={"w-6"} /> },
        { href: store.instagram_url, label: "Instagram", icon: <Instagram classnames={"w-6"} /> },
    ].filter((p) => p.href);

    const legal = only_ours([
        { href: "/info/imprint", label: t("imprint"), aria: "imprint" },
        { href: "/info/policy", label: t("privacyPolicy"), aria: "privacy policy" },
        { href: "/info/terms", label: t("terms"), aria: "terms of use" },
        { href: "/info/withdraw", label: t("withdrawal"), aria: "withdrawal" },
        { href: "/info/disclaimer", label: t("disclaimer"), aria: "disclaimer" },
        { href: "/info/cookies", label: t("cookiePolicy"), aria: "cookies policy" },
    ]);
    const shop = only_ours([
        { href: "/shop", label: t_nav("watches"), aria: "watches" },
        { href: "/spare", label: t_nav("spareParts"), aria: "spare parts" },
        { href: "/info/about", label: t_nav("aboutUs"), aria: "about us" },
    ]);
    const service = only_ours([
        { href: "/store", label: t_nav("store"), aria: "store" },
        { href: "/sell", label: t_nav("sellConsign"), aria: "sell or consign" },
        { href: "/polish", label: t_nav("polishingServices"), aria: "polishing and services" },
        { href: "/info/payments", label: t_nav("shippingPayments"), aria: "shipping and payments" },
        { href: "/info/faq", label: t_nav("faq"), aria: "Frequently Asked Questions" },
        { href: "/info/vacancies", label: t_nav("vacancies"), aria: "Vacancies" },
    ]);
    // The legal column's privacy link has always had this aria-label.
    const legal_column = legal.map((l) => (l.aria == "privacy policy" ? { ...l, aria: "privacy policiy" } : l));

    return (
        <FooterView
            name={store.store_name}
            logo={demo?.logo_horizontal ?? demo?.logo_icon}
            home_href={href("/")}
            compact={Boolean(demo)}
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
                        has("/booking") && (
                            <li>
                                <Link href={href("/booking")} className={LINK}>
                                    {t("byAppointment")}
                                </Link>
                            </li>
                        )
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
                    {/* A lead demo: its private-demo note instead of the store's dealer disclaimer (a claim about the seller). */}
                    {demo ? <p>{demo.footer_note}</p> : <p className="">{t("disclaimerText")}</p>}
                    <p className="">{t("copyright", { year: new Date().getFullYear() })}</p>
                    <div className="flex-center flex-wrap gap-4 lg:gap-3">
                        {legal.map((l) => (
                            <Link key={l.href} aria-label={l.aria} href={l.href} className={LINK}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </>
            }
        >
            <Column heading={t("shopHeading")} links={shop} />
            {/* A lead demo: its collections and brands (service pages are the store's own). */}
            <Column heading={t("serviceHeading")} links={service} />
            {/* A lead demo: its collections and brands too. */}
            {demo && (
                <>
                    <Column heading={demo.collections_heading ?? ""} links={demo.collections.map((c) => ({ href: href(c.path), label: c.label, aria: c.label }))} />
                    <Column heading={t_filters("brands")} links={demo.brands.map((b) => ({ href: href(b.path), label: b.label, aria: b.label }))} />
                </>
            )}
            {/* Only the profiles the store has filled in under Admin → Settings (a demo: the seller's Instagram) */}
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
            <Column heading={t("legalHeading")} links={legal_column} />
        </FooterView>
    );
}

function Column({ heading, links }: { heading: string; links: FooterLink[] }) {
    if (!links.length) return null;
    return (
        <FooterColumn heading={heading}>
            {links.map((l) => (
                <li key={l.href}>
                    <Link aria-label={l.aria} href={l.href} className={LINK}>
                        {l.label}
                    </Link>
                </li>
            ))}
        </FooterColumn>
    );
}
