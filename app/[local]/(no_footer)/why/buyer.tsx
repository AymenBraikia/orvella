import { getTranslations } from "next-intl/server";

export default async function Buyer() {
    const t = await getTranslations("why.buyer");

    return (
        <section className="min-h-dvh w-full bg-background font-primary flex justify-center items-start flex-col py-20 gap-8">
            <p className="md:text-5xl text-3xl tracking-wide leading-14">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <div className="flex-center gap-4 w-full flex-wrap">
                {t.raw("steps").map(({ number, title, description }: { number: string; title: string; description: string }) => (
                    <div key={number} className="w-full xl:w-[calc(25%-12px)] xl:h-45 2xl:h-40 p-4 border-b border-(--bg-secondary) font-sans">
                        <h6>
                            {number} {title}
                        </h6>
                        <p className="text-sm tracking-wide leading-8 2xl:leading-6 text-secondary">{description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
