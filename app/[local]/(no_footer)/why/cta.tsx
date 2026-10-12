import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CTA() {
    const t = await getTranslations("why.cta");

    return (
        <section id="cta" className="min-h-dvh h-fit w-full text-center bg-background font-primary flex flex-col justify-center items-center py-20 gap-8 scroll-mt-20">
            <p className="md:text-5xl text-3xl tracking-wide leading-16">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary italic">{chunks}</span>,
                })}
            </p>
            <p className="text-shine font-sans tracking-wide md:w-150">{t("description")}</p>
            <div className="flex-center gap-4 min-w-fit md:w-130 w-full md:flex-row flex-col">
                <Link href="https://www.instagram.com/ayme.n0412/" className="button w-full font-sans font-light">
                    {t("sendStock")}
                </Link>
                <Link href="/" target="_blank" className="button2 w-full font-sans font-light" prefetch={true}>
                    {t("openStorefront")}
                </Link>
            </div>
            <p className="text-secondary text-sm font-sans tracking-wider">{t("credit")}</p>
        </section>
    );
}
