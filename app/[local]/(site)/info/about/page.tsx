import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
    const t = await getTranslations("about");

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px]">
                <p>{t("paragraphs.0")}</p>

                <p className="text-[16px] font-medium">{t("paragraphs.1")}</p>

                <div>
                    <p>{t("paragraphs.2")}</p>
                    <br />
                    <p>{t("paragraphs.3")}</p>
                    <br />
                    <p>{t("paragraphs.4")}</p>
                </div>

                <p>{t("paragraphs.5")}</p>

                <div className="flex flex-col gap-4">
                    <Link href="/sell" className="underline">
                        {t("sellCta")}
                    </Link>

                    <Link href="/sell" className="underline">
                        {t("consignmentCta")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
