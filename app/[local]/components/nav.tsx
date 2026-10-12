"use client";
import Link from "next/link";
import { ActionDispatch, Dispatch, RefObject, SetStateAction, useEffect, useState } from "react";
import Cross from "./svg/cross";
import { useLocale, useTranslations } from "next-intl";
import { NavThemeToggle } from "./navTheme";
import Select from "./elements/select";
import { Locales } from "@/types/locales";
import { usePathname, useRouter } from "@/i18n/routing";
import { Supported_Currencies } from "@/currency";
import setCurrency from "@/app/server/set_currency";
import LearnMore from "./buttons/learnMore";

type UIAction = { type: "OPEN_NAV" } | { type: "CLOSE_NAV" } | { type: "OPEN_CART" } | { type: "CLOSE_CART" } | { type: "TOGGLE_LANG" } | { type: "SET_GLASSY"; payload: boolean };

const locales_map = new Map<string, Locales>([
    ["English", "en"],
    ["Deutsch", "de"],
    ["Arabic", "ar"],
    ["French", "fr"],
    ["Italian", "it"],
    ["Turkish", "tr"],
    ["Spanish", "es"],

    ["en", "en"],
    ["de", "de"],
    ["ar", "ar"],
    ["fr", "fr"],
    ["it", "it"],
    ["tr", "tr"],
    ["es", "es"],
]);

const currencies_options = new Map<string, Supported_Currencies>([
    ["USD (US Dollar)", "USD"],
    ["CAD (Canadian Dollar)", "CAD"],
    ["AUD (Australian Dollar)", "AUD"],
    ["GBP (British Pound)", "GBP"],
    ["EUR (Euro)", "EUR"],
    ["CHF (Swiss Franc)", "CHF"],
    ["HKD (Hong Kong Dollar)", "HKD"],
    ["JPY (Japanese Yen)", "JPY"],
    ["SGD (Singapore Dollar)", "SGD"],
    ["CNY (Chinese Yuan)", "CNY"],
]);
const currencies_map = new Map<string, Supported_Currencies>([
    ["USD (US Dollar)", "USD"],
    ["CAD (Canadian Dollar)", "CAD"],
    ["AUD (Australian Dollar)", "AUD"],
    ["GBP (British Pound)", "GBP"],
    ["EUR (Euro)", "EUR"],
    // ["SAR (Saudi Riyal)", "SAR"],
    // ["AED (UAE Dirham)", "AED"],
    // ["QAR (Qatari Riyal)", "QAR"],
    // ["KWD (Kuwaiti Dinar)", "KWD"],
    // ["BHD (Bahraini Dinar)", "BHD"],
    ["CHF (Swiss Franc)", "CHF"],
    ["HKD (Hong Kong Dollar)", "HKD"],
    ["JPY (Japanese Yen)", "JPY"],
    ["SGD (Singapore Dollar)", "SGD"],
    ["CNY (Chinese Yuan)", "CNY"],

    ["USD", "USD"],
    ["CAD", "CAD"],
    ["AUD", "AUD"],
    ["GBP", "GBP"],
    ["EUR", "EUR"],
    // ["SAR", "SAR"],
    // ["AED", "AED"],
    // ["QAR", "QAR"],
    // ["KWD", "KWD"],
    // ["BHD", "BHD"],
    ["CHF", "CHF"],
    ["HKD", "HKD"],
    ["JPY", "JPY"],
    ["SGD", "SGD"],
    ["CNY", "CNY"],
]);

export default function Nav({ savedCurrency, dispatch, ui, ref }: { savedCurrency: Supported_Currencies; ref: RefObject<HTMLElement | null>; dispatch: ActionDispatch<[action: UIAction]>; ui: { isNavOpen: boolean } }) {
    const nav = useTranslations("common.nav");
    const footer = useTranslations("common.footer");

    const locale = useLocale() as Locales;

    const [lang, set_lang] = useState<Locales>(locale);

    const selected_locale = locales_map.get(lang)!.toUpperCase();

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        router.replace(pathname, { locale: selected_locale });
    }, [lang]);

    const [currency, set_currency] = useState<Supported_Currencies>(savedCurrency);

    useEffect(() => {
        setCurrency(currencies_map.get(currency)!);
    }, [currency]);
    return (
        <nav
            ref={ref}
            className={`bg-background z-70 w-dvw sm:min-w-100 lg:w-[20dvw] transition-default max-h-dvh h-dvh fixed top-0 inset-s-0 flex flex-col justify-between items-start gap-5 p-5 md:gap-8 md:px-16 md:py-8 ${
                ui.isNavOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
            }`}
        >
            <div className="flex flex-col h-7/10 md:h-6/10 gap-6">
                <div className="flex flex-col gap-3 md:gap-6 w-full font-secondary h-full sm:hidden">
                    <h5 className="title3 font-primary">{footer("settingsHeading")}</h5>
                    <div className="w-full flex justify-between items-center">
                        <p>{footer("themeHeading")}</p>
                        <NavThemeToggle />
                    </div>

                    <Select
                        classnames="z-61 font-sans flex text-sm sm:text-base w-full"
                        label={footer("language")}
                        options={["English", "Spanish", "Deutsch", "French", "Italian", "Turkish"]}
                        value={selected_locale}
                        set_value={set_lang as Dispatch<SetStateAction<string>>}
                    />
                    <Select
                        label={footer("currency")}
                        classnames="font-sans sm:hidden flex text-sm sm:text-base"
                        options={currencies_options.keys().toArray()}
                        value={currencies_map.get(currency)!}
                        set_value={set_currency as Dispatch<SetStateAction<string>>}
                    />
                </div>

                <div className="flex flex-col gap-3 md:gap-6">
                    <h5 className="title3 font-primary">{footer("shopHeading")}</h5>
                    <ul className="gap-2!">
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="watches list" href="/shop">
                                {nav("watches")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="spare parts" href="/spare">
                                {nav("spareParts")}
                            </Link>
                        </li>

                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="about us" href="/info/about">
                                {nav("aboutUs")}
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col gap-3 md:gap-6">
                    <h5 className="title3 font-primary">{footer("serviceHeading")}</h5>
                    <ul className="gap-2!">
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Store" href="/store">
                                {nav("store")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Sell / Consign" href="/sell">
                                {nav("sellConsign")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Polishing and Service" href="/polish">
                                {nav("polishingServices")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Shipping & Payments" href="/info/payments">
                                {nav("shippingPayments")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Frequently Asked Questions" href="/info/faq">
                                {nav("faq")}
                            </Link>
                        </li>
                        <li>
                            <Link onClick={() => dispatch({ type: "CLOSE_NAV" })} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label="Vacancies" href="/info/vacancies">
                                {nav("vacancies")}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <LearnMore />
            <button aria-label={"close"} type="button" className="absolute top-4 inset-e-4 p-0 cursor-pointer" onClick={() => dispatch({ type: "CLOSE_NAV" })}>
                <Cross classnames={"w-10"} />
            </button>
        </nav>
    );
}
