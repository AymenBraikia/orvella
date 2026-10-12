import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function Hero() {
    const t = await getTranslations("home");

    return (
        <section className="flex-col flex-center w-dvw h-dvh fixed top-0 inset-s-0 text-white">
            <video aria-hidden="true" autoPlay muted loop playsInline preload="metadata" poster="/hero_placeholder.webp" className="absolute inset-0 -z-10 size-full object-cover dark:brightness-50">
                <source src="/hero_vid.mp4" type="video/mp4" />
            </video>

            <div className="flex-center flex-col font-primary gap-2 text-center">
                <h1 className="tracking-widest font-light!">{t("heroTitle")}</h1>

                <h2 className="sm:title5 title4 tracking-wider dark:text-shine text-(--bg-secondary) italic font-secondary">{t("heroSubtitle")}</h2>

                <Link href="#new" aria-label={t("discover")} className="underline dark:text-shine text-(--bg-secondary) tracking-wider title4">
                    {t("discover")}
                </Link>
            </div>
        </section>
    );
}
