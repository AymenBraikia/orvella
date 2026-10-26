"use client";

import { useAuth } from "@/app/(site)/context/authContext";
import create_order from "@/app/server/create_order";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateOrderBtn({ enabled = true }: { enabled?: boolean }) {
    const t = useTranslations("checkout");
    const t_errors = useTranslations("checkout.errors");
    const { session } = useAuth();
    const router = useRouter();

    const [placing, set_placing] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    function check_address(): boolean {
        if (!enabled) return false;
        if (!session) return false;
        const { address1, postCode, city, country, phone } = session.address;

        const is_address_provided =
            (session.diff_address.active && session.diff_address.address1 && session.diff_address.postCode && session.diff_address.city && session.diff_address.country && session.diff_address.phone) ||
            (!session.diff_address.active && address1 && postCode && city && country && phone)
                ? true
                : false;

        return session.local_pickup || is_address_provided;
    }

    const validated = check_address() && !placing;

    async function place() {
        if (!validated) return;

        set_placing(true);
        set_error(null);

        const result = await create_order();

        if ("id" in result) return router.push("/thank_you");

        set_placing(false);
        set_error(t_errors(result.error, { items: result.items?.join(", ") ?? "" }));
        router.refresh();
    }

    return (
        <>
            <button type="button" onClick={place} className={`button3 text-primary bg-gold hover:text-gold hover:bg-background w-full mt-4 sm:text-base text-sm ${validated ? "" : "disabled"} `}>
                {t("placeOrder")}
            </button>
            {error && (
                <p role="alert" className="text-red-400 text-sm">
                    {error}
                </p>
            )}
        </>
    );
}
