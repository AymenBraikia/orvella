"use client";

import { useAuth } from "@/app/(site)/context/authContext";
import addToCart from "@/app/server/add_to_cart";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ItemStatus } from "@/types/item";

export default function AtcBtn({ slug, status = "available", children }: { slug: string; status?: ItemStatus; children?: React.ReactNode }) {
    const t = useTranslations("common.buttons");
    const t_stock = useTranslations("common.stock");
    const router = useRouter();
    const { session } = useAuth();

    const [inserting, set_insert] = useState<boolean>(false);
    const [is_in_cart, set_is_in_cart] = useState<boolean>(session?.cart.find((i) => i.slug == slug) ? true : false);

    if (status != "available") {
        return <div className="border border-gold text-gold w-full h-fit p-4 select-none flex-center uppercase tracking-widest cursor-default">{t_stock(status)}</div>;
    }

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
            className={`button3 bg-gold hover:text-background hover:bg-foreground w-full h-fit active:scale-95 select-none transition-default flex-center capitalize ${is_in_cart || inserting ? "cursor-not-allowed brightness-75" : "cursor-pointer"}`}
        >
            {is_in_cart ? t("already_in_cart") : children ? children : inserting ? t("adding_to_cart") : t("add_to_cart")}
        </button>
    );
}
