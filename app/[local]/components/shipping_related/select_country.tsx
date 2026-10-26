"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import shipping_data from "@/app/shipping.json";
import Select from "../elements/select";
import { useTranslations } from "next-intl";
import updateUser from "@/app/server/update_user";
import type { User } from "@/types/user";

const shipping_options: string[] = Object.values(shipping_data).map((c) => c.country_name);

export default function Select_country({ address }: { address: User["address"] }) {
    const [country, set_country] = useState<string>(address.country || "Germany");
    const router = useRouter();
    const t = useTranslations("cart");

    async function choose(next: string) {
        set_country(next);
        if (await updateUser({ address: { ...address, country: next } })) router.refresh();
    }

    return <Select options={shipping_options} set_value={choose as never} value={country} label={t("choose_shipping_country")} />;
}
