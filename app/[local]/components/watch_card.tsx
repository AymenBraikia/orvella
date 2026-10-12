"use client";
import { memo } from "react";

import Image from "next/image";
import { format_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Supported_Currencies } from "@/currency";
import { read_cookie } from "../(site)/lib/read_cookie";

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
    slug,
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
    slug: string;
}) {
    const t = useTranslations("common.productCard");
    return (
        <Link href={`/product/${slug}`} className="group overflow-hidden transition-default hover:-translate-y-1 cursor-pointer font-secondary sm:px-0 px-4 w-full">
            <div className="sm:aspect-4/3 aspect-4/3 relative w-full">
                <Image src={image_src} alt={image_src} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 40vw" className="group-hover:brightness-100 brightness-80 transition-default" />
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
                <span className="text-xl font-semibold text-foreground font-sans">{format_price(price, read_cookie("Currency") as Supported_Currencies)}</span>
            </div>
        </Link>
    );
});
