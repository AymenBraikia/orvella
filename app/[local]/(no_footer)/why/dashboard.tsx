import Image from "next/image";
import { getTranslations } from "next-intl/server";

const SHOTS = ["overview", "order", "product", "lead"] as const;

/** Which files exist in /public/why was recorded at build time (see next.config.ts). */
const media = new Set(process.env.NEXT_PUBLIC_WHY_MEDIA?.split(",").filter(Boolean));

/** The admin, shown to prospects. Nothing appears until the media files are in /public/why. */
export default async function Dashboard() {
    const t = await getTranslations("why.dashboard");

    const has_video = media.has("dashboard.mp4");
    const shots = SHOTS.filter((shot) => media.has(`shot-${shot}.webp`));
    if (!has_video && !shots.length) return null;

    return (
        <>
            <hr className="w-dvw text-(--bg-secondary)" />
            <section className="h-fit w-full bg-background font-primary flex justify-center items-start flex-col py-20 gap-8">
                <p className="md:text-5xl text-3xl tracking-wide leading-14">
                    {t.rich("title", {
                        br: () => <br />,
                        span: (chunks) => <span className="text-secondary">{chunks}</span>,
                    })}
                </p>
                <p className="font-sans text-secondary text-sm tracking-wide leading-8 md:w-150">{t("description")}</p>
                <hr className="w-full text-(--bg-secondary) h-px" />

                {has_video && (
                    <video controls playsInline preload="none" aria-label={t("video")} poster={media.has("dashboard-poster.webp") ? "/why/dashboard-poster.webp" : undefined} className="w-full aspect-video bg-primary">
                        <source src="/why/dashboard.mp4" type="video/mp4" />
                    </video>
                )}

                {shots.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 w-full">
                        {shots.map((shot) => (
                            <figure key={shot} className="flex flex-col gap-2">
                                <div className="relative w-full aspect-video bg-primary overflow-hidden">
                                    <Image src={`/why/shot-${shot}.webp`} alt={t(`shots.${shot}`)} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-top" />
                                </div>
                                <figcaption className="font-sans text-secondary text-sm tracking-wide">{t(`shots.${shot}`)}</figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
