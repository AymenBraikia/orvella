import { getTranslations } from "next-intl/server";
import Banner from "@/app/components/banner";
import Quiz from "./quiz";

export async function generateMetadata() {
    const t = await getTranslations("consultation");
    return { title: t("heading") };
}

export default async function ConsultationPage() {
    const t = await getTranslations("consultation");

    return (
        <div className="w-full flex flex-col items-center gap-12 py-10 px-4 sm:px-20">
            <Banner>
                <h1 className="font-secondary">{t("heading")}</h1>
                <p className="max-w-150 text-secondary">{t("intro")}</p>
            </Banner>
            <Quiz />
        </div>
    );
}
