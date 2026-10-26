import Link from "next/link";
import List from "./scrollList";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";
import get_new from "@/app/server/get_new";
import update_currency_rates from "@/app/server/update_currency_rates";
import NewCardWrapper from "./wrappers/newCard";

export default async function New() {
    await update_currency_rates();
    const t = await getTranslations("home");
    const t_btn = await getTranslations("common.buttons");
    const watches = await get_new();

    return (
        <section className="flex flex-col justify-center items-start sm:p-16 p-4 py-8 w-dvw gap-6 scroll-mt-20" id="new">
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver>
                    <h1 className={`text-5xl font-secondary tracking-wide sections text-gold`}>{t("newArrivalsHeading")}</h1>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver delay={100}>
                    <p className="text-shine">{t("newArrivalsSubtext")}</p>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col font-secondary">
                <FadeInObserver delay={200}>
                    <Link aria-label={t_btn("viewAllWatches")} href={"/shop"} className="underline text-xl text-gold" prefetch={true}>
                        {t_btn("viewAllWatches")}
                    </Link>
                </FadeInObserver>
            </div>

            <div className={`w-full sm-w-fit`}>
                <List display={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>
                    {watches.map((data) => (
                        <NewCardWrapper key={data.slug} data={data} />
                    ))}
                </List>
            </div>
        </section>
    );
}
