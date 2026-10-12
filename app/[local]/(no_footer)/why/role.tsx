import { getTranslations } from "next-intl/server";

export default async function Role() {
    const t = await getTranslations("why.role");

    return (
        <section className="h-fit w-full bg-background font-primary flex md:flex-row flex-col justify-center items-start py-20 gap-8">
            <p className="md:text-5xl text-3xl tracking-wide leading-14 md:w-2/5">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
            </p>
            <div className="md:w-3/5 flex flex-col justify-start items-start gap-8 font-sans">
                <p className="text-secondary leading-8 font-light">{t("description")}</p>
                <div className="font-primary w-full h-fit border border-(--bg-secondary) flex md:flex-row flex-col justify-between items-center gap-4 p-8">
                    <div className="md:w-fit w-full h-full flex flex-col gap-4">
                        <p className="text-secondary font-sans">{t("existingFlowTitle")}</p>
                        <h5 className="min-w-fit">{t("existingFlow")}</h5>
                    </div>
                    <p className="text-3xl text-secondary hidden md:block">→</p>
                    <hr className="w-full md:hidden text-(--bg-secondary)" />
                    <div className="md:w-fit w-full h-full flex flex-col gap-4">
                        <p className="text-secondary font-sans">{t("expandedFlowTitle")}</p>
                        <h5 className="min-w-fit">{t("expandedFlow")}</h5>
                    </div>
                </div>
                <p className="text-secondary font-light text-sm tracking-wide">{t("footnote")}</p>
            </div>
        </section>
    );
}
