"use client";
import { ActionDispatch, Dispatch, RefObject, SetStateAction, useState } from "react";
import NavPanel, { NavSettings } from "./nav_panel";
import { useLocale, useTranslations } from "next-intl";
import Select from "./elements/select";
import { Locales } from "@/types/locales";
import { usePathname, useRouter } from "@/i18n/routing";
import { Supported_Currencies } from "@/currency";
import setCurrency from "@/app/server/set_currency";
import LearnMore from "./buttons/learnMore";
import { DEMO_MODE } from "../(site)/lib/demo";
import { useStorefront } from "../(site)/context/storefrontContext";
import type { NavSection } from "./nav_panel";

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

    const selected_locale = locale.toUpperCase();

    const pathname = usePathname();
    const router = useRouter();

    // Only when the visitor picks another language / currency — these used to run on every page
    // load (a client navigation plus a server action that re-rendered the whole layout).
    const set_lang = (label: string) => {
        const next = locales_map.get(label);
        if (next && next != locale) router.replace(pathname, { locale: next });
    };

    const [currency, set_currency_state] = useState<Supported_Currencies>(savedCurrency);
    const set_currency = (label: string) => {
        const next = currencies_map.get(label);
        if (!next || next == currency) return;
        set_currency_state(next);
        setCurrency(next);
    };
    const close = () => dispatch({ type: "CLOSE_NAV" });

    // A lead demo links only to its own pages, under its address; it has one language and no prices.
    const { demo, href, has } = useStorefront();
    const t_filters = useTranslations("common.filters");
    const main_sections: NavSection[] = [
        {
            heading: footer("shopHeading"),
            links: [
                { href: "/shop", label: nav("watches"), aria: "watches list" },
                { href: "/spare", label: nav("spareParts"), aria: "spare parts" },
                { href: "/info/about", label: nav("aboutUs"), aria: "about us" },
            ],
        },
        {
            heading: footer("serviceHeading"),
            links: [
                { href: "/store", label: nav("store"), aria: "Store" },
                { href: "/sell", label: nav("sellConsign"), aria: "Sell / Consign" },
                { href: "/polish", label: nav("polishingServices"), aria: "Polishing and Service" },
                { href: "/info/payments", label: nav("shippingPayments"), aria: "Shipping & Payments" },
                { href: "/info/faq", label: nav("faq"), aria: "Frequently Asked Questions" },
                { href: "/info/vacancies", label: nav("vacancies"), aria: "Vacancies" },
            ],
        },
    ]
        .map((section) => ({ ...section, links: section.links.filter((link) => has(link.href)).map((link) => ({ ...link, href: href(link.href) })) }))
        .filter((section) => section.links.length > 0);
    // A lead demo: the store's menu (its pages, under its address), plus its collections and brands.
    const sections: NavSection[] = demo
        ? [
              ...main_sections,
              { heading: demo.collections_heading ?? "", links: demo.collections.map((c) => ({ href: href(c.path), label: c.label, aria: c.label })) },
              { heading: t_filters("brands"), links: demo.brands.map((b) => ({ href: href(b.path), label: b.label, aria: b.label })) },
          ].filter((section) => section.links.length > 0)
        : main_sections;

    return (
        <NavPanel
            ref={ref}
            open={ui.isNavOpen}
            onClose={close}
            settings={
                // A demo with a forced theme would have an empty settings block (no language or currency there).
                !demo?.forced_theme && (
                <NavSettings heading={footer("settingsHeading")} theme_label={footer("themeHeading")}>
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
                </NavSettings>
                )
            }
            sections={sections}
            extra={DEMO_MODE && !demo && <LearnMore />}
        />
    );
}
