"use client";

import updateUser from "@/app/server/update_user";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function Payment_Options({ default_option }: { default_option: "PayPal" | "Credit/Debit Card" | "Bank Transfer" }) {
    const [option, set_option] = useState<"PayPal" | "Credit/Debit Card" | "Bank Transfer">(default_option);
    const t = useTranslations("checkout");
    return (
        <div className="w-full flex-center">
            <button
                type="button"
                onClick={async () => option != "Bank Transfer" && (await updateUser({ payment_method: "Bank Transfer" })) && set_option("Bank Transfer")}
                className={`w-full h-full sm:px-2 sm:py-4 p-2 transition-default ${option == "Bank Transfer" ? "bg-gold brightness-100 button3" : "brightness-75 button2"}`}
            >
                {t("bankTransfer")}
            </button>
            <button
                type="button"
                onClick={async () => option != "PayPal" && (await updateUser({ payment_method: "PayPal" })) && set_option("PayPal")}
                className={`w-full h-full sm:px-2 sm:py-4 p-2 transition-default ${option == "PayPal" ? "bg-gold brightness-100 button3" : "brightness-75 button2"}`}
            >
                PayPal
            </button>
            <button
                type="button"
                onClick={async () => option != "Credit/Debit Card" && (await updateUser({ payment_method: "Credit/Debit Card" })) && set_option("Credit/Debit Card")}
                className={`w-full h-full sm:px-2 sm:py-4 p-2 transition-default ${option == "Credit/Debit Card" ? "bg-gold brightness-100 button3" : "brightness-75 button2"}`}
            >
                {t("card")}
            </button>
        </div>
    );
}
