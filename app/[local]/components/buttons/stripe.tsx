"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { start_stripe_checkout } from "@/app/server/stripe_checkout";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

/** Reserves the pieces and continues on Stripe's secure payment page. */
export default function StripeButton({ ready }: { ready: boolean }) {
    const t = useTranslations("checkout");
    const t_errors = useTranslations("checkout.errors");
    const router = useRouter();
    const [busy, set_busy] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    async function pay() {
        if (!ready) return set_error(t_errors("details"));
        set_busy(true);
        set_error(null);

        const result = await start_stripe_checkout();
        if ("url" in result) return window.location.assign(result.url);

        set_busy(false);
        set_error(t_errors(result.error, { items: result.items?.join(", ") ?? "" }));
        router.refresh();
    }

    return (
        <div className="w-full flex flex-col gap-2">
            <button type="button" onClick={pay} disabled={busy} className={`button3 text-primary bg-gold hover:text-gold hover:bg-background w-full sm:text-base text-sm ${ready && !busy ? "" : "disabled"}`}>
                {busy ? t("redirectingToPayment") : t("payByCard")}
            </button>
            <p className="text-xs text-secondary">{t("cardNote")}</p>
            {DEMO_MODE && <TestCardNote />}
            {error && (
                <p role="alert" className="text-red-400 text-sm">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Separate so the "demo" messages, which only reach the browser on the demo, are read there alone. */
function TestCardNote() {
    const t = useTranslations("demo");
    return <p className="text-xs text-gold font-semibold">{t("testPayment")} {t("testCard")}</p>;
}
