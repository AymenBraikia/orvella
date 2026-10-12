"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import CheckBox from "../elements/checkbox";
import updateUser from "@/app/server/update_user";

export default function Pickup_wrapper() {
    const [local_pickup, set_local_pickup] = useState<boolean>(false);
    const t = useTranslations("cart");

    return (
        <CheckBox
            label={t("localPickup")}
            action={async (e: boolean) => {
                await updateUser({ local_pickup: e }) &&
                set_local_pickup(e);
            }}
            active={local_pickup}
        />
    );
}
