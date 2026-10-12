"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import List from "./scrollList";
import { ZoomableImage } from "./elements/zoomableImage";
import AtcBtn from "./buttons/addToCart";
import { Watch } from "@/types/watch";
import { Spare } from "@/types/spare";
import Cross from "./svg/cross";
import { format_price } from "../(site)/lib/price_format";
import increase_relevance_score from "@/app/server/increase_relevance_score";
import score_rewards from "../(site)/lib/relevance_score";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { read_cookie } from "../(site)/lib/read_cookie";
import { Supported_Currencies } from "@/currency";

interface QuickViewProps {
    view: Watch | Spare | null;
    onClose: () => void;
}

export default function QuickViewModal({ view, onClose }: QuickViewProps) {
    const t = useTranslations("common");

    const [increased, set_increased] = useState(false);
    const [mounted, set_mounted] = useState(false);

    useEffect(() => {
        set_mounted(true);
        if (!increased && view) {
            increase_relevance_score(view.slug, score_rewards.quick_view);
            set_increased(true);
        }
    }, [view, increased]);

    if (!view || !mounted) return null;


    return createPortal(
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
                        <p className="font-semibold tracking-tight capitalize text-2xl sm:text-3xl lg:text-4xl">{view.brand}</p>
                        <p className="tracking-wide capitalize text-secondary text-lg sm:text-xl lg:text-2xl">{view.model}</p>
                        <p className="font-medium tracking-wide text-xl sm:text-2xl">{format_price(view.price, read_cookie("Currency") as Supported_Currencies)}</p>

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

                        <p className="leading-relaxed tracking-wide text-xs sm:text-sm md:text-base text-shine">{view.description}</p>
                    </div>

                    <div className="w-full flex-center gap-4">
                        <div className="w-full">
                            <AtcBtn slug={view.slug} />
                        </div>
                        <Link href={"/product/" + view.slug} className="w-full button2 flex-center">
                            {t("productCard.details")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
