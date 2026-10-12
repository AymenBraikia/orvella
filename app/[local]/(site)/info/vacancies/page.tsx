import { getTranslations } from "next-intl/server";

export default async function VacanciesPage() {
    const t = await getTranslations("vacancies");

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px]">
                <h2>{t("empty")}</h2>
            </div>
        </div>
    );
}
