"use client";
import CreateOrderBtn from "@/app/components/buttons/create_order";
import Input from "@/app/components/elements/input";
import { UserData } from "@/types/user";
import { useTranslations } from "next-intl";
import { ChangeEvent, useEffect, useState } from "react";

export default function Cards() {
    const t = useTranslations("checkout");

    const [card_number, set_card_numbers] = useState<string>("");
    const [expire, set_expire] = useState<string>("");
    const [sec_code, set_sec_code] = useState<string>("");

    function validate_cc(e: ChangeEvent<HTMLInputElement, HTMLInputElement>) {
        const rawValue = e.target.value.replace(/\D/g, "");

        const trimmedValue = rawValue.slice(0, 16);

        const formattedValue = trimmedValue.replace(/(\d{4})(?=\d)/g, "$1 ");

        set_card_numbers(formattedValue);
    }
    function validate_exp(e: ChangeEvent<HTMLInputElement>) {
        const rawValue = e.target.value.replace(/\D/g, "");
        const trimmedValue = rawValue.slice(0, 4);
        const formattedValue = trimmedValue.replace(/(\d{2})(?=\d)/, "$1/");
        set_expire(formattedValue);
    }

    function validate_sec(e: ChangeEvent<HTMLInputElement>) {
        const rawValue = e.target.value.replace(/\D/g, "");
        const formattedValue = rawValue.slice(0, 4);
        set_sec_code(formattedValue);
    }


    function check_info(): boolean {
        if (card_number.replaceAll(" ", "").length != 16) {
            console.clear();
            console.log(16);
            return false;
        }
        if (expire.length != 5) {
            console.clear();
            console.log(4);
            return false;
        }
        if (sec_code.length != 3) {
            console.clear();
            console.log(3);
            return false;
        }

        return true;
    }

    const [enabled, set_enabled] = useState<boolean>(check_info());

    useEffect(() => {
        set_enabled(check_info());
    }, [card_number, expire, sec_code]);

    return (
        <div className="w-full flex flex-wrap gap-4">
            <div className="sm:text-xl text-sm tracking-wider w-full">
                <Input label={t("cardNumber")} type="text" max={19} placeholder="1234 1234 1234 1234" onChange={validate_cc} value={card_number} />
            </div>

            <div className="sm:text-xl text-sm tracking-wider w-[calc(50%-8px)]">
                <Input label={t("expirationDate")} type="text" max={19} placeholder="MM/YY" onChange={validate_exp} value={expire} />
            </div>

            <div className="sm:text-xl text-sm tracking-wider w-[calc(50%-8px)]">
                <Input label={t("securityCode")} type="text" max={3} placeholder="123" onChange={validate_sec} value={sec_code} />
            </div>

            <CreateOrderBtn enabled={enabled} />
        </div>
    );
}
