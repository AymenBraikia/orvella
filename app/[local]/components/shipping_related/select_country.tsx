"use client";
import { useEffect, useState } from "react";
import shipping_data from "@/app/shipping.json";
import { useAuth } from "@/app/(site)/context/authContext";
import Select from "../elements/select";
import { useTranslations } from "next-intl";
import updateUser from "@/app/server/update_user";

const shipping_options: string[] = Object.values(shipping_data).map((c) => c.country_name);

export default function Select_country() {
    const { session } = useAuth();
    const [country, set_country] = useState<string>(session?.address.country || "Germany");

    const t = useTranslations("cart");

    useEffect(() => {
        updateUser({ address: { ...session!.address, country } });
    }, [country]);

    return <Select options={shipping_options} set_value={set_country} value={country} label={t("choose_shipping_country")} />;
}
