"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { useMounted } from "./hooks/use_mounted";
import List from "./scrollList";
import { ZoomableImage } from "./elements/zoomableImage";
import AtcBtn from "./buttons/addToCart";

import Cross from "./svg/cross";
import { format_price } from "../(site)/lib/price_format";
import increase_relevance_score from "@/app/server/increase_relevance_score";
import score_rewards from "../(site)/lib/relevance_score";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { read_cookie } from "../(site)/lib/read_cookie";
import { Supported_Currencies } from "@/currency";
import { Item } from "../(site)/lib/filters";

interface QuickViewProps {
    view: Item | null;
    onClose: () => void;
}

export default function QuickViewModal({ view, onClose }: QuickViewProps) {
    const t = useTranslations("common");

    const mounted = useMounted();
    const scored = useRef<string | null>(null);

    useEffect(() => {
        if (view && scored.current !== view.slug) {
            scored.current = view.slug;
            increase_relevance_score(view.slug, score_rewards.quick_view);
        }
    }, [view]);

    if (!view || !mounted) return null;

    return createPortal(
        view.type == "watch" || view.type == "spare" ? (
            <div className="fixed fade-in w-dvw h-dvh inset-s-0 top-0 z-70 bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${view.brand} ${view.model} quick view`}
                    className="relative p-4 sm:pt-30 pt-25 flex w-full h-full flex-col md:flex-row bg-background font-secondary outline-none flex-center"
                >
                    <button aria-label={"close"} type="button" className="button absolute top-34 inset-e-4 z-20 p-0" onClick={onClose}>
                        <Cross classnames="w-10" />
                    </button>

                    <div className="w-full md:h-full md:max-w-1/2 max-w-100 sm:max-w-full md:px-0 lg:px-30 sm:px-15 flex-center">
                        <List display={{ base: 1, sm: 1, md: 1, lg: 1 }}>
                            {view.images.map((url, index) => (
                                <div key={`${url}-${index}`} className="relative w-full h-full aspect-square sm:aspect-video md:aspect-square">
                                    <ZoomableImage src={url} alt={view.slug} />
                                </div>
                            ))}
                        </List>
                    </div>

                    <div className="flex w-full flex-col justify-center px-4 md:px-8 gap-2 md:h-full md:gap-6">
                        <div className="flex flex-col gap-1 md:gap-2">
                            <p className="sm:hidden font-semibold tracking-tight capitalize text-xl sm:text-3xl lg:text-4xl text-gold">{view.brand + " " + view.model}</p>

                            <p className="hidden sm:block font-semibold tracking-tight capitalize text-2xl sm:text-3xl lg:text-4xl">{view.brand}</p>
                            <p className="hidden sm:block tracking-wide capitalize text-secondary text-lg sm:text-xl lg:text-2xl">{view.model}</p>

                            <p className="font-medium tracking-wide text-base sm:text-2xl">{format_price(view.price, read_cookie("Currency") as Supported_Currencies)}</p>

                            <div className="hidden md:flex flex-col gap-2 leading-relaxed tracking-wide text-sm text-secondary">
                                <p>
                                    {t("filters.movement")}: {view.movement}
                                </p>
                                <p className={`${view.caseMaterial == "UNVERIFIED" ? "hidden" : "block"}`}>
                                    {t("filters.caseMaterial")}: {view.caseMaterial}
                                </p>
                                <p className={`${view.braceletMaterial == "UNVERIFIED" ? "hidden" : "block"}`}>
                                    {t("filters.braceletMaterial")}: {view.braceletMaterial}
                                </p>
                                <p>
                                    {t("filters.condition")}: {view.condition}
                                </p>
                                <p className={`${view.dialColor == "UNVERIFIED" ? "hidden" : "block"}`}>
                                    {t("filters.dialColor")}: {view.dialColor}
                                </p>
                                <p>
                                    {t("filters.caseDiameterMm")}: {view.caseDiameterMm} mm
                                </p>
                                <p>
                                    {t("filters.year")}: {view.year}
                                </p>
                                <p>
                                    {t("filters.waterResistance")}: {view.waterResistanceM}m
                                </p>
                            </div>

                            <p className="leading-relaxed tracking-wide text-xs sm:text-sm md:text-base text-shine hidden sm:block">{view.description}</p>
                        </div>

                        <div className="w-full flex-center gap-4 flex-col sm:flex-row">
                            <div className="w-full">
                                <AtcBtn slug={view.slug} status={view.stock_status} />
                            </div>
                            <Link href={"/product/" + view.slug} className="w-full button2 flex-center">
                                {t("productCard.details")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="fixed fade-in w-dvw h-dvh inset-s-0 top-0 z-70 bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${view.display_name} quick view`}
                    className="relative p-4 sm:pt-30 pt-25 flex w-full h-full flex-col md:flex-row bg-background font-secondary outline-none flex-center"
                >
                    <button aria-label={"close"} type="button" className="button absolute top-34 inset-e-4 z-20 p-0" onClick={onClose}>
                        <Cross classnames="w-10" />
                    </button>

                    <div className="w-full md:h-full md:max-w-1/2 max-w-100 sm:max-w-full md:px-0 lg:px-30 sm:px-15 flex-center">
                        <List display={{ base: 1, sm: 1, md: 1, lg: 1 }}>
                            {view.images.map((url, index) => (
                                <div key={`${url}-${index}`} className="relative w-full h-full aspect-square sm:aspect-video md:aspect-square">
                                    <ZoomableImage src={url} alt={view.slug} />
                                </div>
                            ))}
                        </List>
                    </div>

                    <div className="flex w-full flex-col justify-center px-4 md:px-8 gap-2 md:h-full md:gap-6">
                        <div className="flex flex-col gap-1 md:gap-2">
                            <p className="sm:hidden font-semibold tracking-tight capitalize text-xl sm:text-3xl lg:text-4xl">{view.display_name}</p>

                            <p className="hidden sm:block font-semibold tracking-tight capitalize text-2xl sm:text-3xl lg:text-4xl">{view.display_name}</p>

                            <p className="font-medium tracking-wide text-base sm:text-2xl text-gold">{format_price(view.price, read_cookie("Currency") as Supported_Currencies)}</p>

                            <div className="hidden md:flex flex-col gap-2 leading-relaxed tracking-wide text-sm text-primary capitalize">
                                <p className={`${view.metal_type ? "block" : "hidden"}`}>
                                    {t("productCard.material")}: {view.metal_type + " " + ((view.fineness || view.karats) + (view.metal_type == "Gold" || view.metal_type == "White Gold" ? "K" : ""))}
                                </p>
                                <p className={`${view.stones?.length ? "block" : "hidden"}`}>
                                    {t("productCard.gemstones")}: {view.stones?.join(", ")}
                                </p>
                                <p className={`${view.stones?.length ? "block" : "hidden"}`}>
                                    {t("productCard.weight")}: {view.weight + " " + view.measurement_unit}
                                </p>

                                {view.type == "bracelet" || view.type == "necklace" ? (
                                    <>
                                        <p className={`${view.length ? "block" : "hidden"}`}>
                                            {t("productCard.length")}: {view.length + " " + view.length_unit}
                                        </p>
                                        <p className={`${view.clasp_type ? "block" : "hidden"}`}>{view.clasp_type}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className={`${view.ring_size ? "block" : "hidden"}`}>
                                            {t("productCard.size")}: {view.ring_size}
                                        </p>
                                        <p className={`${view.band_width ? "block" : "hidden"}`}>
                                            {t("productCard.bandWidth")}: {view.band_width}
                                        </p>
                                    </>
                                )}
                            </div>

                            <p className="leading-relaxed tracking-wide text-xs sm:text-sm md:text-base text-shine hidden sm:block">{view.description}</p>
                        </div>

                        <div className="w-full flex-center gap-4 flex-col sm:flex-row">
                            <div className="w-full">
                                <AtcBtn slug={view.slug} status={view.stock_status} />
                            </div>
                            <Link href={"/product/" + view.slug} className="w-full button2 flex-center">
                                {t("productCard.details")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        ),
        document.body,
    );
}
