"use client"
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LearnMore() {
    const t = useTranslations("intrest");
    return (
        <Link aria-label={t("cta")} className="z-10 sm:text-2xl text-xl underline font-light font-secondary" href={"/why"} prefetch={true}>
            {t("cta")}
        </Link>
    );
}
