"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DEMO_MODE } from "../(site)/lib/demo";

const KEY = "demo-banner-dismissed";
const listeners = new Set<() => void>();

function read(): boolean {
    try {
        return localStorage.getItem(KEY) === "1";
    } catch {
        return false;
    }
}

/** Thin "this is a demo" strip above the header, only in DEMO_MODE; dismissible per browser. */
export default function DemoBanner() {
    // The "demo" messages only reach the browser on the demo.
    return DEMO_MODE ? <Banner /> : null;
}

function Banner() {
    const t = useTranslations("demo");
    const dismissed = useSyncExternalStore(
        (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },
        read,
        () => false,
    );

    if (dismissed) return null;

    function dismiss() {
        try {
            localStorage.setItem(KEY, "1");
        } catch {
            // private mode: hide for this page view only
        }
        listeners.forEach((cb) => cb());
    }

    return (
        <div className="w-full h-fit text-xs font-secondary bg-primary text-secondary sm:p-2 p-1 flex-center gap-3 tracking-wider">
            <p>{t("banner")}</p>
            <Link href="/why" className="underline text-gold">
                {t("learnMore")}
            </Link>
            <button type="button" onClick={dismiss} aria-label={t("dismiss")} className="px-1 cursor-pointer hover:text-foreground">
                ×
            </button>
        </div>
    );
}
