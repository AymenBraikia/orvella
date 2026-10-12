import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function PrivacyPolicyPage() {
    const t = await getTranslations("legal.privacyPolicy");

    const intro = t.raw("intro") as string[];
    const structureList = t.raw("structureList") as string[];
    const rightsItems = t.raw("sections.rights.items") as string[];
    const paypalParagraphs = t.raw("sections.paypal.paragraphs") as string[];
    const sessionCookieParagraphs = t.raw("sections.cookies.sessionCookies.paragraphs") as string[];
    const thirdPartyCookieParagraphs = t.raw("sections.cookies.thirdPartyCookies.paragraphs") as string[];
    const disablingCookieParagraphs = t.raw("sections.cookies.disablingCookies.paragraphs") as string[];
    const youtubeParagraphs = t.raw("sections.youtube.paragraphs") as string[];
    const facebookParagraphs = t.raw("sections.facebook.paragraphs") as string[];
    const instagramParagraphs = t.raw("sections.instagram.paragraphs") as string[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-8 text-[14px]">
                {intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                ))}

                <ul className="list-disc ms-4">
                    {structureList.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>

            <ul className="list-decimal">
                <li className="text-[36px]">
                    {t("sections.controller.heading")}
                    <div className="text-[14px]">
                        <p>{t("sections.controller.text")}</p>
                    </div>
                </li>

                <li className="text-[36px]">
                    {t("sections.rights.heading")}
                    <div className="text-[14px] flex flex-col gap-8">
                        <p>{t("sections.rights.intro")}</p>

                        <ul className="list-disc ms-4">
                            {rightsItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <p>{t("sections.rights.outro")}</p>
                    </div>
                </li>

                <li className="text-[36px]">
                    {t("sections.dataProcessing.heading")}
                    <div className="text-[14px] flex flex-col gap-8">
                        <p>{t("sections.dataProcessing.text")}</p>

                        <h6>{t("sections.paypal.heading")}</h6>
                        {paypalParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        <Link href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" className="underline">
                            https://www.paypal.com/de/webapps/mpp/ua/privacy-full
                        </Link>

                        <h6>{t("sections.cookies.heading")}</h6>

                        <ul className="list-disc ms-4">
                            <li className="font-bold">
                                {t("sections.cookies.sessionCookies.heading")}
                                <div className="flex justify-center items-start flex-col font-normal gap-4">
                                    {sessionCookieParagraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </li>

                            <li className="font-bold">
                                {t("sections.cookies.thirdPartyCookies.heading")}
                                <div className="flex justify-center items-start flex-col font-normal gap-4">
                                    {thirdPartyCookieParagraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </li>

                            <li className="font-bold">
                                {t("sections.cookies.disablingCookies.heading")}
                                <div className="flex justify-center items-start flex-col font-normal gap-4">
                                    {disablingCookieParagraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </li>
                        </ul>

                        <h6>{t("sections.youtube.heading")}</h6>
                        {youtubeParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        <Link href="https://policies.google.com/privacy" className="underline">
                            https://policies.google.com/privacy
                        </Link>

                        <h6>{t("sections.facebook.heading")}</h6>
                        {facebookParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        <Link href="https://www.facebook.com/privacy/explanation" className="underline">
                            https://www.facebook.com/privacy/explanation
                        </Link>

                        <h6>{t("sections.instagram.heading")}</h6>
                        {instagramParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        <Link href="https://help.instagram.com/519521250107875" className="underline">
                            https://help.instagram.com/519521250107875
                        </Link>
                    </div>
                </li>
            </ul>
        </div>
    );
}
