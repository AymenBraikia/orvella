"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancel_stripe_order } from "@/app/server/stripe_checkout";

/** Back from Stripe without paying: release the held pieces and say so. */
export default function StripeCancelled({ order_id }: { order_id: string }) {
    const t = useTranslations("checkout");
    const router = useRouter();
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        done.current = true;
        cancel_stripe_order(order_id).then(() => router.refresh());
    }, [order_id, router]);

    return <p className="w-full border border-secondary/40 p-3 text-sm font-sans">{t("cardCancelled")}</p>;
}
