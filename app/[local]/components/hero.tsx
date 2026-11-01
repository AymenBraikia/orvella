import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import HeroVideo from "./hero_video";

const POSTER = "/hero_poster.webp"; // the video's first frame, so the switch to the video is seamless

export default async function Hero() {
    const t = await getTranslations("home");

    return (
        <section className="flex-col flex-center w-dvw h-dvh fixed top-0 inset-s-0 text-white">
            <Image src={POSTER} alt="" aria-hidden="true" fill preload fetchPriority="high" sizes="100vw" quality={70} className="-z-30 object-cover" />
            <HeroVideo src="/hero_vid.mp4" poster={POSTER} />
            {/* Keeps the headline readable over the bright parts of the photo and video. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-radial from-black/30 to-black/75" />

            <div className="flex-center flex-col font-primary gap-2 text-center px-4">
                <h1 className="tracking-widest font-light! text-gold text-6xl">{t("heroTitle")}</h1>

                <h2 className="sm:title5 title4 tracking-wider dark:text-shine text-(--bg-secondary) italic font-secondary">{t("heroSubtitle")}</h2>

                <Link href="#sections" aria-label={t("discover")} className="underline text-gold tracking-wider title4">
                    {t("discover")}
                </Link>
            </div>
        </section>
    );
}
