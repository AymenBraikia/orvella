import { getTranslations } from "next-intl/server";
import { store_identity } from "@/app/server/store_identity";
import ArbitrationStatement from "../arbitration_statement";

export default async function ImprintPage() {
    const t = await getTranslations("imprint");
    const store = await store_identity();

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-2 text-[14px]">
                <p className="font-bold">{store.legal_name}</p>
                {store.store_name != store.legal_name && <p>{store.store_name}</p>}
                <p>{store.address.street}</p>
                <p>
                    {store.address.postcode} {store.address.city}
                </p>
                <p>{store.address.country}</p>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("phoneLabel")}</p>
                    {store.phone}
                </div>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("emailLabel")}</p>
                    {store.email}
                </div>

                {store.vat_id && (
                    <div className="flex-center gap-2">
                        <p className="font-bold">{t("vatIdLabel")}</p>
                        {store.vat_id}
                    </div>
                )}

                {(store.register_court || store.register_number) && (
                    <div className="flex-center gap-2">
                        <p className="font-bold">{t("registerLabel")}</p>
                        {[store.register_court, store.register_number].filter(Boolean).join(", ")}
                    </div>
                )}

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("representativesLabel")}</p>
                    {store.representative}
                </div>

                <br />

                <h6>{t("arbitrationHeading")}</h6>

                <ArbitrationStatement />
            </div>
        </div>
    );
}
