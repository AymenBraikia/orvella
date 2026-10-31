import { getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";

/** Whether the shop takes part in consumer arbitration (§ 36 VSBG). Imprint and terms must say the same. */
export default async function ArbitrationStatement({ className }: { className?: string }) {
    const t = await getTranslations("imprint");
    const { arbitration_participates, arbitration_board } = await store_identity();

    return <p className={className}>{arbitration_participates ? t("arbitrationWilling", { board: arbitration_board }) : t("arbitrationDeclined")}</p>;
}
