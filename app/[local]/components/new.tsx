import { getTranslations } from "next-intl/server";
import get_new from "@/app/server/get_new";
import load_rates from "@/app/server/update_currency_rates";
import { current_demo, server_href } from "@/app/server/storefront";
import NewCardWrapper from "./wrappers/newCard";
import NewView from "./new_view";

export default async function New() {
    await load_rates();
    const t = await getTranslations("home");
    const t_btn = await getTranslations("common.buttons");
    const watches = await get_new();
    // A lead demo can name this section and its text itself (the store's text is about its own stock).
    const own = current_demo()?.new_arrivals;

    return (
        <NewView heading={own?.heading ?? t("newArrivalsHeading")} subtext={own?.subtext ?? t("newArrivalsSubtext")} link={{ href: server_href("/shop"), label: t_btn("viewAllWatches") }}>
            {watches.map((data) => (
                <NewCardWrapper key={data.slug} data={data} />
            ))}
        </NewView>
    );
}
