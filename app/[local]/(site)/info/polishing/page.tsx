import { getTranslations } from "next-intl/server";

export default async function PolishPage() {
    const t = await getTranslations("polish");

    const polishingItems = t.raw("polishing.items") as string[];
    const maintenanceItems = t.raw("maintenance.items") as string[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px]">
                <p>{t("intro")}</p>

                <h3>{t("servicesHeading")}</h3>

                <div className="flex justify-start items-start flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold">{t("polishing.heading")}</h5>

                        <p>{t("polishing.intro")}</p>

                        <ul className="list-disc list-inside">
                            {polishingItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold">{t("maintenance.heading")}</h5>

                        <p>{t("maintenance.intro")}</p>

                        <ul className="list-disc list-inside">
                            {maintenanceItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <p className="pt-2">{t("maintenance.note")}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold">{t("expertHeading")}</h5>
                        <p>{t("expertText")}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold">{t("qualityHeading")}</h5>
                        <p>{t("qualityText")}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h5 className="font-semibold">{t("speedHeading")}</h5>
                        <p>{t("speedText")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
