import { getTranslations } from "next-intl/server";
import { Phone } from "./devices";

export default async function Dealer() {
    const t = await getTranslations("why.dealer");
    const t_visuals = await getTranslations("why.visuals");

    return (
        <section className="h-fit min-h-dvh w-full bg-background font-primary flex justify-center items-start flex-col py-20 gap-8">
            <p className="md:text-5xl text-3xl tracking-wide leading-14">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <hr className="w-full text-(--bg-secondary) h-px" />
            <div className="w-full flex flex-col lg:flex-row-reverse items-center lg:items-start gap-10">
                <Phone src="/why/store-phone.webp" alt={t_visuals("storePhone")} className="w-52 lg:w-60 shrink-0" />
                <div className="flex flex-col gap-4 w-full">
                    {t.raw("benefits").map(({ title, description }: { title: string; description: string }) => (
                        <div key={title} className="w-full p-4 border-b gap-4 flex md:flex-row flex-col">
                            <h5 className="md:w-50 shrink-0">{title}</h5>
                            <p className="font-sans text-secondary text-sm tracking-wide leading-8">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
