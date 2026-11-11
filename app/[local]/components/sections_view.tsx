import Link from "next/link";
import Image from "next/image";
import FadeInObserver from "./fade_wrapper";

export type SectionCard = { href: string; label: string; explore: string; image: string };

/** "Find your forever piece.": a heading, a line of text and one tall image card per category. */
export default function SectionsView({ heading, subtext, cards }: { heading: string; subtext: string; cards: SectionCard[] }) {
    return (
        <section className="flex flex-col justify-center items-start sm:p-16 p-4 py-8 w-dvw gap-6 scroll-mt-20" id="sections">
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver>
                    <p className={`lg:text-5xl md:text-4xl text-3xl font-secondary tracking-wide text-gold`}>{heading}</p>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver delay={100}>
                    <p className="text-shine sm:text-base text-sm">{subtext}</p>
                </FadeInObserver>
            </div>

            <div className={`w-full sm-w-fit flex-center gap-4 font-primary flex-wrap`}>
                {cards.map((card, i) => (
                    <div key={card.href} className="w-full sm:aspect-2/3 aspect-4/5 sm:w-[calc(25%-16px)]">
                        <FadeInObserver delay={200 + i * 100}>
                            <Link href={card.href} className="relative w-full h-full flex justify-end items-start flex-col gap-2 p-4 group overflow-hidden text-white">
                                <h1>{card.label}</h1>
                                <h5 className="underline text-gold capitalize">{card.explore}</h5>
                                <Image
                                    alt={card.label}
                                    src={card.image}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                    className="-z-10 transition-default brightness-75 group-hover:brightness-100 group-hover:scale-110"
                                ></Image>
                            </Link>
                        </FadeInObserver>
                    </div>
                ))}
            </div>
        </section>
    );
}
