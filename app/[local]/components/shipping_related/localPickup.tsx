"use client";
import { useState } from "react";
import { useAuth } from "@/app/(site)/context/authContext";
import { useTranslations } from "next-intl";
import CheckBox from "../elements/checkbox";
import updateUser from "@/app/server/update_user";

export default function LocalPickup_checkbox() {
    const { session } = useAuth();
    const [pickup, set_pickup] = useState<boolean>(session?.local_pickup || false);

    const t = useTranslations("cart");

    if (!session) return;

    const toggle = (value: boolean) => {
        set_pickup(value);
        updateUser({ local_pickup: value });
    };

    return <CheckBox label={t("localPickup")} active={pickup} action={toggle} />;
}
