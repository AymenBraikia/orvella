import Banner from "@/app/components/banner";
import Display_list from "@/app/components/display_list";
import get_items from "@/app/server/get_items";
import { getTranslations } from "next-intl/server";

export default async function SparePage() {
    const parts = (await get_items()).filter((e) => e.type == "spare");
    const t = await getTranslations("spare");
    return (
        <div className="flex justify-center items-start flex-col w-full sm:gap-10 sm:py-20">
            <Banner>
                <h1>{t("title")}</h1>
            </Banner>

            <div className="sm:px-16 p-2">
                <Display_list items={parts} />
            </div>
        </div>
    );
}
