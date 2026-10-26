"use client";
import { memo, useState } from "react";

import { format_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCurrency } from "../(site)/context/currencyContext";
import Display_Image from "./display_image";
import StockBadge from "./stock_badge";
import type { ItemStatus } from "@/types/item";

export default memo(function Watch_card({
    brand,
    name,
    description,
    movement,
    size,
    braceletMaterial,
    caseMaterial,
    condition,
    price,
    image_src,
    video_src,
    slug,
    status,
}: {
    brand: string;
    name: string;
    description: string;
    movement: string;
    size: number;
    braceletMaterial: string;
    caseMaterial: string;
    condition: string;
    price: number;
    image_src: string;
    video_src?: string;
    slug: string;
    status?: ItemStatus;
}) {
    const t = useTranslations("common.productCard");
    const currency = useCurrency();

    const [play_video, set_play_video] = useState<boolean>(false);

    return (
        <Link
            href={`/product/${slug}`}
            className="group overflow-hidden transition-default hover:-translate-y-1 cursor-pointer font-secondary sm:px-0 px-4 w-full"
            onMouseEnter={() => set_play_video(true)}
            onMouseLeave={() => set_play_video(false)}
        >
            <div className="sm:aspect-4/3 aspect-4/3 relative w-full overflow-hidden">
                <StockBadge status={status} />
                <Display_Image image_src={image_src} vid_src={video_src} play={play_video} />
            </div>
            <div className="py-4 flex flex-col justify-start items-start gap-3 min-h-50">
                <span className="text-xs uppercase tracking-[0.3em] text-secondary">{brand}</span>
                <h4 className="font-semibold capitalize">{name}</h4>
                <p className="leading-6 text-shine">{description}</p>
                <div className="space-y-1 text-sm text-secondary">
                    {movement == "UNVERIFIED" ? (
                        <></>
                    ) : (
                        <p>
                            {t("movement")}: {movement}
                        </p>
                    )}
                    <p>
                        {t("caseSize")}: {size} mm
                    </p>
                    {braceletMaterial == "UNVERIFIED" ? (
                        <></>
                    ) : (
                        <p>
                            {t("bracelet")}: {braceletMaterial}
                        </p>
                    )}
                    {caseMaterial == "UNVERIFIED" ? (
                        <></>
                    ) : (
                        <p>
                            {t("material")}: {caseMaterial}
                        </p>
                    )}
                    {condition == "UNVERIFIED" ? (
                        <></>
                    ) : (
                        <p>
                            {t("condition")}: {condition}
                        </p>
                    )}
                </div>
                <span className="text-xl font-semibold text-foreground font-sans">{format_price(price, currency)}</span>
            </div>
        </Link>
    );
});
