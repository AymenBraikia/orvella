"use client";

import updateUser from "@/app/server/update_user";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = "PayPal" | "Bank Transfer";

export default function Payment_Options({ default_option, methods }: { default_option: Option; methods: Option[] }) {
    const [option, set_option] = useState<Option>(default_option);
    const t = useTranslations("checkout");
    const router = useRouter();

    async function choose(next: Option) {
        if (option == next) return;
        if (await updateUser({ payment_method: next })) {
            set_option(next);
            router.refresh();
        }
    }

    return (
        <div className="w-full flex-center">
            {methods.includes("Bank Transfer") && <button type="button" onClick={() => choose("Bank Transfer")} className={`w-full h-full sm:px-2 sm:py-4 p-2 transition-default ${option == "Bank Transfer" ? "bg-gold brightness-100 button3" : "brightness-75 button2"}`}>
                {t("bankTransfer")}
            </button>}
            {methods.includes("PayPal") && <button type="button" onClick={() => choose("PayPal")} className={`w-full h-full sm:px-2 sm:py-4 p-2 transition-default ${option == "PayPal" ? "bg-gold brightness-100 button3" : "brightness-75 button2"}`}>
                PayPal
            </button>}
        </div>
    );
}
