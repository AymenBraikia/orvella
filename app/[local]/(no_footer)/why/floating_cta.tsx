"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Floating_Cta() {
    const t = useTranslations("why");
    const [active, set_active] = useState<boolean>(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > window.innerHeight * 0.1) !active && set_active(true);
            else if (active) set_active(false);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [active]);

    return (
        <div className={`min-w-fit whitespace-nowrap bg-primary transition-default fixed bottom-5 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 hover:bg-background active:scale-95 shine ${active ? "fade-in" : "invisible fade-out"}`}>
            <Link prefetch={true} href="/" className="sm:py-4 sm:px-6 py-3 px-4 text-shine font-secondary text-sm lg:title5 tracking-wider capitalize" rel="noopener noreferrer">
                {t("hero.openStorefront")}
            </Link>
        </div>
    );
}
