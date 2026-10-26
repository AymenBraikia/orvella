"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CheckBox from "../elements/checkbox";
import updateUser from "@/app/server/update_user";
import { useAuth } from "@/app/(site)/context/authContext";

export default function Pickup_wrapper() {
    const { session } = useAuth();
    const [local_pickup, set_local_pickup] = useState<boolean>(session?.local_pickup ?? false);
    const t = useTranslations("cart");
    const router = useRouter();

    return (
        <CheckBox
            label={t("localPickup")}
            action={async (e: boolean) => {
                if (await updateUser({ local_pickup: e })) {
                    set_local_pickup(e);
                    router.refresh();
                }
            }}
            active={local_pickup}
        />
    );
}
