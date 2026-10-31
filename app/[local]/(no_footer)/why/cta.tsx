import { getTranslations } from "next-intl/server";
import Link from "next/link";

const INSTAGRAM = "https://www.instagram.com/ayme.n0412/";

/** How prospects reach me, set per deployment. WhatsApp comes first; Instagram only when nothing is set. */
function pitch_contacts(t: Awaited<ReturnType<typeof getTranslations<"why.cta">>>) {
    const whatsapp = process.env.NEXT_PUBLIC_PITCH_WHATSAPP?.replace(/\D/g, "");
    const booking = process.env.NEXT_PUBLIC_PITCH_BOOKING_URL;
    const email = process.env.NEXT_PUBLIC_PITCH_EMAIL;

    const contacts = [whatsapp && { href: `https://wa.me/${whatsapp}`, label: t("whatsapp") }, booking && { href: booking, label: t("sendStock") }, email && { href: `mailto:${email}`, label: t("email") }].filter((c) => !!c);

    return contacts.length ? contacts : [{ href: INSTAGRAM, label: t("sendStock") }];
}

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
            <div className="flex-center gap-4 min-w-fit md:w-130 w-full md:flex-row md:flex-wrap flex-col">
                {pitch_contacts(t).map(({ href, label }, i) => (
                    <a key={href} href={href} className={`${i == 0 ? "button" : "button2"} w-full md:flex-1 md:basis-[calc(50%-8px)] font-sans font-light`}>
                        {label}
                    </a>
                ))}
                <Link href="/" target="_blank" className="button2 w-full md:flex-1 md:basis-[calc(50%-8px)] font-sans font-light" prefetch={true}>
                    {t("openStorefront")}
                </Link>
            </div>
            <p className="text-secondary text-sm font-sans tracking-wider">{t("credit")}</p>
        </section>
    );
}
