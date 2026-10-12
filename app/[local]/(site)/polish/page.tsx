import Banner from "@/app/components/banner";
import { getTranslations } from "next-intl/server";

export default async function polishPage() {
    const t = await getTranslations("polish");
    const polishItems = t.raw("polishing.items") as {
        title: string;
        text: string;
    }[];

    const maintenanceItems = t.raw("maintenance.items") as {
        title: string;
        text: string;
    }[];

    return (
        <div className="flex flex-col justify-start items-start gap-6 py-6 sm:px-20 px-6 mt-10">
            <Banner>
                <h1 className="font-semibold font-secondary">{t("heading")}</h1>
            </Banner>
            <p className="tracking-widest leading-6 text-shine">{t("intro")}</p>
            <h2 className="font-secondary">{t("servicesHeading")}</h2>

            <div className="flex flex-col justify-start items-start gap-2">
                <h5 className="font-medium text-shine font-secondary">{t("polishing.heading")}</h5>
                <p className="tracking-widest leading-6 text-secondary">{t("polishing.intro")}</p>
                <p className="tracking-widest leading-6 text-sm my-1">
                    {polishItems.map((e) => (
                        <>
                            - {e} <br />
                        </>
                    ))}
                </p>
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                <h5 className="font-medium text-shine font-secondary">{t("maintenance.heading")}</h5>
                <p className="tracking-widest leading-6 text-secondary">{t("maintenance.intro")}</p>
                <p className="tracking-widest leading-6 text-sm my-1">
                    {maintenanceItems.map((e) => (
                        <>
                            - {e} <br />
                        </>
                    ))}
                </p>
                <p className="tracking-widest leading-6">{t("maintenance.note")}</p>
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                <h5 className="font-medium text-shine font-secondary">{t("expertHeading")}</h5>
                <p className="tracking-widest leading-6">{t("expertText")}</p>
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                <h5 className="font-medium text-shine font-secondary">{t("qualityHeading")}</h5>
                <p className="tracking-widest leading-6">{t("qualityText")}</p>
            </div>

            <div className="flex flex-col justify-start items-start gap-2">
                <h5 className="font-medium text-shine font-secondary">{t("speedHeading")}</h5>
                <p className="tracking-widest leading-6">{t("speedText")}</p>
            </div>
        </div>
    );
}
