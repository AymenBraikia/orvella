import { getTranslations } from "next-intl/server";
import { Phone } from "./devices";
import InstagramThread from "./instagram_thread";

export default async function Gap() {
    const t = await getTranslations("why.gap");
    const t_visuals = await getTranslations("why.visuals");
    return (
        <section id="gap" className="min-h-dvh w-full bg-background font-primary flex justify-center items-start flex-col py-20 gap-8 scroll-mt-20">
            <p className="md:text-5xl text-3xl tracking-wide leading-14">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <p className="max-w-170 text-secondary font-sans text-sm tracking-wide leading-8">{t("description")}</p>

            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-6 md:gap-16">
                <figure className="flex flex-col items-center gap-4">
                    <Phone className="w-56 sm:w-60">
                        <InstagramThread />
                    </Phone>
                    <figcaption className="text-secondary font-sans text-sm tracking-wide">{t("instagram.title")}</figcaption>
                </figure>
                <span aria-hidden="true" className="text-secondary text-3xl rotate-90 md:rotate-0 rtl:md:-scale-x-100">
                    →
                </span>
                <figure className="flex flex-col items-center gap-4">
                    <Phone src="/why/product-phone.webp" alt={t_visuals("productPhone")} className="w-56 sm:w-60" />
                    <figcaption className="text-primary font-sans text-sm tracking-wide">{t("storefront.title")}</figcaption>
                </figure>
            </div>

            <div className="flex-center gap-16 w-full md:flex-row flex-col">
                <div className="w-full h-fit min-h-75 p-8 flex justify-start items-start flex-col gap-4 border border-(--bg-secondary) text-secondary">
                    <h4>{t("instagram.title")}</h4>
                    <hr className="w-full h-px text-(--bg-secondary)" />
                    <ul className="text-base font-sans">
                        {t.raw("instagram.items").map((e: string) => (
                            <li key={e}>- {e}</li>
                        ))}
                    </ul>
                </div>
                <div className="w-full h-fit min-h-75 p-8 flex justify-start items-start flex-col gap-4 border text-primary">
                    <h4>{t("storefront.title")}</h4>
                    <hr className="w-full h-px" />
                    <ul className="text-base font-sans">
                        {t.raw("storefront.items").map((e: string) => (
                            <li key={e}>+ {e}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <p className="w-full text-center text-secondary font-sans text-sm tracking-wide leading-8">{t("footnote")}</p>
        </section>
    );
}
