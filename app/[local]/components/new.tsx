import { getTranslations } from "next-intl/server";
import get_new from "@/app/server/get_new";
import load_rates from "@/app/server/update_currency_rates";
import NewCardWrapper from "./wrappers/newCard";
import NewView from "./new_view";

export default async function New() {
    await load_rates();
    const t = await getTranslations("home");
    const t_btn = await getTranslations("common.buttons");
    const watches = await get_new();

    return (
        <NewView heading={t("newArrivalsHeading")} subtext={t("newArrivalsSubtext")} link={{ href: "/shop", label: t_btn("viewAllWatches") }}>
            {watches.map((data) => (
                <NewCardWrapper key={data.slug} data={data} />
            ))}
        </NewView>
    );
}
