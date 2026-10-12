import Banner from "@/app/components/banner";
import Watches_list from "@/app/components/watches_list";
import get_spare_parts from "@/app/server/get_spare";
import { getTranslations } from "next-intl/server";

export default async function SparePage() {
    const parts = await get_spare_parts();
    const t = await getTranslations("spare");
    return (
        <div className="flex justify-center items-start flex-col w-full sm:gap-10 sm:py-20">
            <Banner>
                <h1>{t("title")}</h1>
            </Banner>

            <div className="sm:px-16 p-2">
                <Watches_list watches={parts} />
            </div>
        </div>
    );
}
