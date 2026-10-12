import { getTranslations } from "next-intl/server";

export default async function GettingStarted() {
    const t = await getTranslations("why.gettingStarted");

    return (
        <section className="h-fit w-full bg-background font-primary flex flex-col justify-center items-start py-20 gap-8">
            <p className="md:text-5xl text-2xl tracking-wide md:leading-14 leading-8">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <p className="text-secondary font-light font-sans text-sm">{t("description")}</p>

            <div className="flex-center md:flex-row flex-col w-full gap-4">
                {t.raw("steps").map(({ number, title, description }: { number: string; title: string; description: string }) => (
                    <div key={number} className="w-full min-h-60 h-fit border border-(--bg-secondary) flex flex-col justify-start items-start gap-4 p-8">
                        <p className="font-sans text-xs text-secondary">{number}</p>
                        <h5>{title}</h5>
                        <p className="font-sans text-secondary tracking-wide leading-6 font-light text-sm">{description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
