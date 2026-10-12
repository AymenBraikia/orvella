import { getLocale, getTranslations } from "next-intl/server";
type Props = {
    params: Promise<{ ref: string }>;
};

export default async function CookiesPage({ params }: Props) {
    const { ref } = await params;

    const t = await getTranslations("legal.cookiePolicy");
    const common = await getTranslations("common");
    const locale = await getLocale();

    const lastUpdated = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date("2026-01-08"));

    const synchronizedDate = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date("2026-06-30"));

    const cookieTypes = [
        {
            heading: t("cookieTypes.technical.heading"),
            text: t("cookieTypes.technical.text"),
        },
        {
            heading: t("cookieTypes.statistics.heading"),
            text: t("cookieTypes.statistics.text"),
        },
        {
            heading: t("cookieTypes.marketing.heading"),
            text: t("cookieTypes.marketing.text"),
        },
    ];

    const consentSettings = [
        {
            heading: t("consentSettings.functional.heading"),
            text: t("consentSettings.functional.text"),
        },
        {
            heading: t("consentSettings.statistics.heading"),
            text: t("consentSettings.statistics.text"),
        },
        {
            heading: t("consentSettings.marketing.heading"),
            text: t("consentSettings.marketing.text"),
        },
    ];

    const rights = t.raw("yourRights.items") as string[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-4 py-20">
            <h1>{t("heading")}</h1>

            <p>
                {t("lastUpdatedNote", {
                    date: lastUpdated,
                })}
            </p>

            <ul className="list-decimal list gap-6">
                <li className="text-2xl">
                    {t("introduction.heading")}
                    <p className="text-[14px] mt-2">{t("introduction.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("whatAreCookies.heading")}
                    <p className="text-[14px] mt-2">{t("whatAreCookies.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("whatAreScripts.heading")}
                    <p className="text-[14px] mt-2">{t("whatAreScripts.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("whatIsAWebBeacon.heading")}
                    <p className="text-[14px] mt-2">{t("whatIsAWebBeacon.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("cookieTypes.heading")}

                    <ul className="list-decimal list gap-4">
                        {cookieTypes.map((cookie) => (
                            <li className="text-[18px]" key={cookie.heading}>
                                {cookie.heading}
                                <p className="text-[14px] mt-2">{cookie.text}</p>
                            </li>
                        ))}
                    </ul>
                </li>

                <li className="text-2xl">
                    {t("placedCookies.heading")}
                    <p className="text-[14px] mt-2">{t("placedCookies.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("consent.heading")}
                    <p className="text-[14px] mt-2">{t("consent.text")}</p>

                    <div className="mt-2">
                        <h6>{t("consentSettings.heading")}</h6>

                        <ul className="list-decimal list gap-4">
                            {consentSettings.map((setting) => (
                                <li className="text-[16px] mt-2" key={setting.heading}>
                                    {setting.heading}

                                    <p className="text-[14px] mt-2">{setting.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>

                <li className="text-2xl">
                    {t("managingCookies.heading")}
                    <p className="text-[14px] mt-2">{t("managingCookies.text")}</p>
                </li>

                <li className="text-2xl">
                    {t("yourRights.heading")}
                    <p className="text-[14px] mt-4">{t("yourRights.intro")}</p>

                    <ul className="list-disc list gap-4 text-[14px] mt-4">
                        {rights.map((right) => (
                            <li key={right}>{right}</li>
                        ))}
                    </ul>
                </li>

                <li className="text-2xl">
                    {t("contact.heading")}

                    <div className="text-[14px] mt-2 flex flex-col justify-start items-start gap-2">
                        <p>{t("contact.intro")}</p>

                        <p>Aymen Braikia</p>
                        <p>{ref || "Arvell"}</p>
                        <p>Walther-von-Cronberg-Platz 18</p>
                        <p>60594 Frankfurt am Main</p>
                        <p>Germany</p>
                        <p>Website: https://{ref || "arvell"}.com</p>
                        <p>Email: info@{ref || "arvell"}.com</p>
                        <p>{common("contactLabels.phonePrimary")}: +4915255443810</p>

                        <p className="mt-2">
                            {t("syncNote", {
                                date: synchronizedDate,
                            })}
                        </p>
                    </div>
                </li>
            </ul>
        </div>
    );
}
