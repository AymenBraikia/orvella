import Link from "next/link";
import FadeInObserver from "./fade_wrapper";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function Sections() {
    const t = await getTranslations("home");
    const tc = await getTranslations("common");

    return (
        <section className="flex flex-col justify-center items-start sm:p-16 p-4 py-8 w-dvw gap-6 scroll-mt-20" id="sections">
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver>
                    <p className={`lg:text-5xl md:text-4xl text-3xl font-secondary tracking-wide text-gold`}>{t("sectionsHeading")}</p>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver delay={100}>
                    <p className="text-shine sm:text-base text-sm">{t("sectionsSubtext")}</p>
                </FadeInObserver>
            </div>

            <div className={`w-full sm-w-fit flex-center gap-4 font-primary flex-wrap`}>
                <div className="w-full sm:aspect-2/3 aspect-4/5 sm:w-[calc(25%-16px)]">
                    <FadeInObserver delay={200}>
                        <Link href={"/watches"} className="relative w-full h-full flex justify-end items-start flex-col gap-2 p-4 group overflow-hidden text-white">
                            <h1>{tc("watches")}</h1>
                            <h5 className="underline text-gold capitalize">{tc("explore")}</h5>
                            <Image
                                alt={tc("watches")}
                                src={"/watches.avif"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                className="-z-10 transition-default brightness-75 group-hover:brightness-100 group-hover:scale-110"
                            ></Image>
                        </Link>
                    </FadeInObserver>
                </div>

                <div className="w-full sm:aspect-2/3 aspect-4/5 sm:w-[calc(25%-16px)]">
                    <FadeInObserver delay={300}>
                        <Link href={"/rings"} className="relative w-full h-full flex justify-end items-start flex-col gap-2 p-4 group overflow-hidden text-white">
                            <h1>{tc("rings")}</h1>
                            <h5 className="underline text-gold capitalize">{tc("explore")}</h5>
                            <Image
                                alt={tc("rings")}
                                src={"/rings.webp"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                className="-z-10 transition-default brightness-75 group-hover:brightness-100 group-hover:scale-110"
                            ></Image>
                        </Link>
                    </FadeInObserver>
                </div>

                <div className="w-full sm:aspect-2/3 aspect-4/5 sm:w-[calc(25%-16px)]">
                    <FadeInObserver delay={400}>
                        <Link href={"/bracelets"} className="relative w-full h-full flex justify-end items-start flex-col gap-2 p-4 group overflow-hidden text-white">
                            <h1>{tc("bracelets")}</h1>
                            <h5 className="underline text-gold capitalize">{tc("explore")}</h5>
                            <Image
                                alt={tc("bracelets")}
                                src={"/bracelets.webp"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                className="-z-10 transition-default brightness-75 group-hover:brightness-100 group-hover:scale-110"
                            ></Image>
                        </Link>
                    </FadeInObserver>
                </div>

                <div className="w-full sm:aspect-2/3 aspect-4/5 sm:w-[calc(25%-16px)]">
                    <FadeInObserver delay={500}>
                        <Link href={"/necklaces"} className="relative w-full h-full flex justify-end items-start flex-col gap-2 p-4 group overflow-hidden text-white">
                            <h1>{tc("necklaces")}</h1>
                            <h5 className="underline text-gold capitalize">{tc("explore")}</h5>
                            <Image
                                alt={tc("necklaces")}
                                src={"/necklaces.avif"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                className="-z-10 transition-default brightness-75 group-hover:brightness-100 group-hover:scale-110"
                            ></Image>
                        </Link>
                    </FadeInObserver>
                </div>
            </div>
        </section>
    );
}
