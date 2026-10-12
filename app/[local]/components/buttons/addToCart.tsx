"use client";

import { useAuth } from "@/app/(site)/context/authContext";
import addToCart from "@/app/server/add_to_cart";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AtcBtn({ slug, children }: { slug: string; children?: React.ReactNode }) {
    const t = useTranslations("common.buttons");
    const router = useRouter();
    const { session } = useAuth();

    const [inserting, set_insert] = useState<boolean>(false);
    const [is_in_cart, set_is_in_cart] = useState<boolean>(session?.cart.find((i) => i.slug == slug) ? true : false);

    async function handleClick() {
        if (session) {
            set_insert(true);

            const success = await addToCart(slug);

            set_insert(false);
            success && set_is_in_cart(true);
        } else router.push("/auth/log_in");
    }

    return (
        <button
            onClick={is_in_cart ? undefined : handleClick}
            aria-label={t("add_to_cart")}
            type="button"
            className={`button w-full h-fit p-4 active:scale-95 select-none transition-default flex-center capitalize ${is_in_cart || inserting ? "cursor-not-allowed brightness-75" : "cursor-pointer"}`}
        >
            {children ? children : inserting ? t("adding_to_cart") : t("add_to_cart")}
        </button>
    );
}
