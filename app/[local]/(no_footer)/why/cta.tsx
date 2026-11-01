import { getTranslations } from "next-intl/server";
import Link from "next/link";
import LeadForm from "./lead/lead_form";

const INSTAGRAM = "https://www.instagram.com/ayme.n0412/";

/** Other ways to reach me, next to the form. Each is set per deployment; Instagram is always there. */
function pitch_contacts(t: Awaited<ReturnType<typeof getTranslations<"why.cta">>>) {
    const whatsapp = process.env.NEXT_PUBLIC_PITCH_WHATSAPP?.replace(/\D/g, "");
    const booking = process.env.NEXT_PUBLIC_PITCH_BOOKING_URL;
    const email = process.env.NEXT_PUBLIC_PITCH_EMAIL;

    return [
        whatsapp && { href: `https://wa.me/${whatsapp}`, label: t("whatsapp") },
        { href: INSTAGRAM, label: t("instagram") },
        email && { href: `mailto:${email}`, label: t("email") },
        booking && { href: booking, label: t("bookCall") },
    ].filter((c) => !!c);
}

export default async function CTA() {
    const t = await getTranslations("why.cta");
    const t_common = await getTranslations("common");

    return (
        <section id="cta" className="min-h-dvh h-fit w-full text-center bg-background font-primary flex flex-col justify-center items-center py-20 px-4 gap-8 scroll-mt-20">
            <p className="md:text-5xl text-3xl tracking-wide leading-16">
                {t.rich("title", {
                    br: () => <br />,
                    span: (chunks) => <span className="text-secondary italic">{chunks}</span>,
                })}
            </p>
            <p className="text-shine font-sans tracking-wide md:w-150">{t("description")}</p>

            <div className="md:w-150 w-full">
                <LeadForm required={t_common("formFields.required")} rate_limited_text={t_common("errors.rateLimited")} />
            </div>

            <div className="flex flex-col items-center gap-3 font-sans text-sm md:w-150 w-full">
                <p className="text-secondary">{t("form.orReach")}</p>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    {pitch_contacts(t).map(({ href, label }) => (
                        <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold transition-default">
                            {label}
                        </a>
                    ))}
                    <Link href="/" target="_blank" className="underline hover:text-gold transition-default" prefetch={true}>
                        {t("openStorefront")}
                    </Link>
                </div>
            </div>
            <p className="text-secondary text-sm font-sans tracking-wider">{t("credit")}</p>
        </section>
    );
}
