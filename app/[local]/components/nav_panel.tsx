import Link from "next/link";
import { RefObject } from "react";
import Cross from "./svg/cross";
import { NavThemeToggle } from "./navTheme";

/** The menu's settings block, phones only: the theme switch, then any other settings (`children`). */
export function NavSettings({ heading, theme_label, children }: { heading: string; theme_label: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 md:gap-6 w-full font-secondary h-full sm:hidden">
            <h5 className="title3 font-primary">{heading}</h5>
            <div className="w-full flex justify-between items-center">
                <p>{theme_label}</p>
                <NavThemeToggle />
            </div>
            {children}
        </div>
    );
}

export type NavSection = { heading: string; links: { href: string; label: string; aria: string }[] };

/**
 * The slide-in menu: an optional settings block (phones only), link sections and a close button.
 * The storefront fills it with its pages.
 */
export default function NavPanel({ ref, open, onClose, settings, sections, extra }: { ref?: RefObject<HTMLElement | null>; open: boolean; onClose: () => void; settings?: React.ReactNode; sections: NavSection[]; extra?: React.ReactNode }) {
    return (
        <nav
            ref={ref}
            className={`bg-background z-70 w-dvw sm:min-w-100 lg:w-[20dvw] transition-default max-h-dvh h-dvh fixed top-0 inset-s-0 flex flex-col justify-between items-start gap-5 p-5 md:gap-8 md:px-16 md:py-8 ${
                open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
            }`}
        >
            <div className="flex flex-col h-7/10 md:h-6/10 gap-6">
                {settings}

                {sections.map((section) => (
                    <div key={section.heading} className="flex flex-col gap-3 md:gap-6">
                        <h5 className="title3 font-primary text-gold">{section.heading}</h5>
                        <ul className="gap-2!">
                            {section.links.map((link) => (
                                <li key={link.href}>
                                    <Link onClick={onClose} className="text-base font-secondary text-secondary hover:text-primary transition-default" aria-label={link.aria} href={link.href}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            {extra}
            <button aria-label={"close"} type="button" className="absolute top-4 inset-e-4 p-0 cursor-pointer" onClick={onClose}>
                <Cross classnames={"w-10"} />
            </button>
        </nav>
    );
}
