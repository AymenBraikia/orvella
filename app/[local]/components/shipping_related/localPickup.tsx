"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/(site)/context/authContext";
import { useTranslations } from "next-intl";
import CheckBox from "../elements/checkbox";
import updateUser from "@/app/server/update_user";

export default function LocalPickup_checkbox() {
    const { session } = useAuth();
    if (!session) return;
    const [pickup, set_pickup] = useState<boolean>(session.local_pickup || false);

    const t = useTranslations("cart");

    useEffect(() => {
        updateUser({ local_pickup: pickup });
    }, [pickup]);

    return <CheckBox label={t("localPickup")} active={pickup} action={set_pickup} />;
}
