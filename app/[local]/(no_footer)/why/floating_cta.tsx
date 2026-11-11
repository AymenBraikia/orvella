"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * "Book your custom demo", pointing at the main CTA. Kept out of the way of what is being read:
 * hidden on the hero, while scrolling down, and while the CTA section itself is on screen.
 */
export function Floating_Cta() {
    const t = useTranslations("why.cta");
    const [scrolled_up, set_scrolled_up] = useState(false);
    const [cta_visible, set_cta_visible] = useState(false);

    useEffect(() => {
        let last = window.scrollY;
        const on_scroll = () => {
            const y = window.scrollY;
            // Small moves (momentum, address bar resizing) don't count as a change of direction.
            if (Math.abs(y - last) < 8) return;
            set_scrolled_up(y < last && y > window.innerHeight * 0.5);
            last = y;
        };
        window.addEventListener("scroll", on_scroll, { passive: true });

        const cta = document.getElementById("cta");
        const observer = new IntersectionObserver(([entry]) => set_cta_visible(entry.isIntersecting), { threshold: 0 });
        if (cta) observer.observe(cta);

        return () => {
            window.removeEventListener("scroll", on_scroll);
            observer.disconnect();
        };
    }, []);

    const active = scrolled_up && !cta_visible;

    return (
        <a
            href="#cta"
            aria-hidden={!active}
            tabIndex={active ? 0 : -1}
            className={`fixed z-40 bottom-3 sm:bottom-5 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap bg-primary hover:bg-background active:scale-95 shine py-2 px-4 sm:py-3 sm:px-6 text-shine font-secondary text-xs sm:text-sm tracking-wider transition-default ${active ? "fade-in" : "invisible fade-out"}`}
        >
            {t("sendStock")}
        </a>
    );
}
