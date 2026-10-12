"use client";
import Link from "next/link";
import List from "./scrollList";
import Image from "next/image";
import FadeInObserver from "./fade_wrapper";
import { useTranslations } from "next-intl";

let id = 0;
const data = [
    { id: id++, src: "/brands/Audemars Piguet.webp", name: "Audemars Piguet" },
    { id: id++, src: "/brands/breitling.webp", name: "breitling" },
    { id: id++, src: "/brands/cartier.webp", name: "Cartier" },
    { id: id++, src: "/brands/iwc.webp", name: "IWC" },
    { id: id++, src: "/brands/omega.webp", name: "Omega" },
    { id: id++, src: "/brands/Patek Philippe.webp", name: "Patek Philippe" },
    { id: id++, src: "/brands/Rolex Oyster Perpetual 26.webp", name: "Rolex" },
    { id: id++, src: "/brands/zenith.webp", name: "Zenith" },
];

export default function Iconic() {
    const t = useTranslations("home");
    const t_btn = useTranslations("common.buttons");
    return (
        <section className="flex-col justify-center items-start sm:p-16 p-4 w-full">
            <div className="w-fit">
                <FadeInObserver>
                    <h1 className={`text-4xl sm:text-5xl font-secondary tracking-wide`}>{t("brandsHeading")}</h1>
                </FadeInObserver>
            </div>
            <br />
            <div className="w-fit">
                <FadeInObserver>
                    <p className="font-secondary text-xl text-shine">{t("brandsSubtext")}</p>
                </FadeInObserver>
            </div>
            <div className={`my-5 font-secondary `}>
                <FadeInObserver>
                    <List display={{ base: 1, sm: 2, md: 2, lg: 3 }}>
                        {data.map((d) => (
                            <Link aria-label={`${d.name} watches`} href={"/brand/" + d.name} className={`h-100 sm:w-[calc(100%-16px)] w-full flex flex-col justify-start items-start relative`} key={d.id}>
                                <div className="relative w-full h-full transition-long brightness-80 hover:brightness-100 overflow-hidden group">
                                    <Image sizes="(max-width: 768px) 100vw, 60vw" src={d.src} fill alt={d.name} className="object-cover object-center select-none transition-long scale-100 hover:scale-105" />
                                    <div className="absolute bottom-0 inset-s-0 translate-y-1/2 w-full h-20 blur-[25px] bg-black group-hover:opacity-0 opacity-100 transition-default"></div>
                                </div>
                                <div className="absolute inset-s-4 bottom-4 flex flex-col p-2 text-white capitalize font-primary">
                                    <h4 className="title4">{d.name}</h4>
                                    <h5 className="underline title5 italic">{t_btn("viewAllWatches")}</h5>
                                </div>
                            </Link>
                        ))}
                    </List>
                </FadeInObserver>
            </div>
        </section>
    );
}
