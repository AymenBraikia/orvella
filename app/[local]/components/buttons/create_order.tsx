"use client";

import create_order from "@/app/server/create_order";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateOrderBtn({ ready }: { ready: boolean }) {
    const t = useTranslations("checkout");
    const t_errors = useTranslations("checkout.errors");
    const router = useRouter();

    const [placing, set_placing] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    const enabled = ready && !placing;

    async function place() {
        if (!enabled) return set_error(ready ? null : t_errors("details"));

        set_placing(true);
        set_error(null);

        const result = await create_order();

        if ("redirect" in result) return router.push(result.redirect);

        set_placing(false);
        set_error(t_errors(result.error, { items: result.items?.join(", ") ?? "" }));
        router.refresh();
    }

    return (
        <>
            <button type="button" onClick={place} className={`button3 text-primary bg-gold hover:text-gold hover:bg-background w-full mt-4 sm:text-base text-sm ${enabled ? "" : "disabled"} `}>
                {placing ? t("placingOrder") : t("placeOrder")}
            </button>
            {error && (
                <p role="alert" className="text-red-400 text-sm">
                    {error}
                </p>
            )}
        </>
    );
}
