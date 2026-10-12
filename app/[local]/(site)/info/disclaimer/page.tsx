import { getTranslations } from "next-intl/server";

export default async function DisclaimerPage() {
    const t = await getTranslations("legal.disclaimer");

    const paragraphs = t.raw("paragraphs") as string[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px]">
                {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
        </div>
    );
}
