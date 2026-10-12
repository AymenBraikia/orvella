import Banner from "@/app/components/banner";
import Items from "./items";
import { getTranslations } from "next-intl/server";

export default async function cartPage() {
    const t = await getTranslations("cart");
    return (
        <div className="flex-center flex-col w-full gap-12 xl:px-20 py-5">
            <Banner>
                <h1 className="font-bold font-secondary">{t("heading")}</h1>
            </Banner>

            <div className="flex-center gap-4 w-full">
                <Items />
            </div>
        </div>
    );
}
