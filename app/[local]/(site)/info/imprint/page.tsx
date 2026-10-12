import { getTranslations } from "next-intl/server";
type Props = {
    params: Promise<{ ref: string }>;
};

export default async function ImprintPage({ params }: Props) {
    const { ref } = await params;
    const t = await getTranslations("imprint");

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-2 text-[14px]">
                <p className="font-bold">Aymen Braikia</p>
                <p>{ref || "Arvell"}</p>
                <p>Marie-Curie-Straße 14</p>
                <p>60439 Frankfurt am Main</p>
                <p>Germany</p>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("phoneLabel")}</p>
                    +49 30 2312 5100
                </div>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("emailLabel")}</p>
                    info@{ref || "arvell"}.com
                </div>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("vatIdLabel")}</p>
                    DE385492701
                </div>

                <div className="flex-center gap-2">
                    <p className="font-bold">{t("representativesLabel")}</p>
                    Aymen Braikia
                </div>

                <br />

                <h6>{t("odrHeading")}</h6>

                <p>{t("odrText")}</p>
            </div>
        </div>
    );
}
