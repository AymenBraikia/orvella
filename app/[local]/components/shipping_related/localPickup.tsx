"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import CheckBox from "../elements/checkbox";
import updateUser from "@/app/server/update_user";

export default function LocalPickup_checkbox({ initial }: { initial: boolean }) {
    const [pickup, set_pickup] = useState<boolean>(initial);
    const router = useRouter();
    const t = useTranslations("cart");

    const toggle = async (value: boolean) => {
        set_pickup(value);
        if (await updateUser({ local_pickup: value })) router.refresh();
    };

    return <CheckBox label={t("localPickup")} active={pickup} action={toggle} />;
}
