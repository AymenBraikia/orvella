"use client";

import { useAuth } from "@/app/(site)/context/authContext";
import create_order from "@/app/server/create_order";
import { useTranslations } from "next-intl";

export default function CreateOrderBtn({ enabled = true }: { enabled?: boolean }) {
    const t = useTranslations("checkout");
    const { session } = useAuth();

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

    const validated = check_address();

    return (
        <button type="button" onClick={async () => validated && (await create_order())} className={`button w-full mt-4 sm:text-base text-sm ${validated ? "" : "disabled"} `}>
            {t("placeOrder")}
        </button>
    );
}
