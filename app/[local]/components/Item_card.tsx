"use client";
import { memo, useState } from "react";

import { format_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCurrency } from "../(site)/context/currencyContext";
import Display_Image from "./display_image";
import { Bracelet, Necklace, Ring } from "@/types/jewelry";
import AtcBtn from "./buttons/addToCart";
import StockBadge from "./stock_badge";

export default memo(function Item_Card({ data }: { data: Ring | Necklace | Bracelet }) {
    const t = useTranslations("common.productCard");
    const t_enquiry = useTranslations("product.enquiry");
    const currency = useCurrency();

    const [play_video, set_play_video] = useState<boolean>(false);

    return (
        <div className="group overflow-hidden transition-default hover:-translate-y-1 cursor-pointer font-secondary sm:px-0 px-4 w-full" onMouseEnter={() => set_play_video(true)} onMouseLeave={() => set_play_video(false)}>
            <Link href={`/product/${data.slug}`} className="sm:aspect-4/3 aspect-4/3 flex w-full overflow-hidden relative">
                <StockBadge status={data.stock_status} />
                <Display_Image image_src={data.images[0]} vid_src={data.video} play={play_video} />
            </Link>
            <div className="py-4 flex flex-col justify-start items-start gap-3 min-h-50">
                <span className="text-xs uppercase tracking-[0.3em] text-gold">{data.type}</span>
                <h6 className="font-thin capitalize">{data.display_name}</h6>
                <p className="leading-6 text-shine">{data.description}</p>
                <div className="space-y-1 text-sm text-secondary">
                    {!data.karats ? (
                        !data.fineness ? (
                            <></>
                        ) : (
                            <p>
                                {t("material")}: {data.fineness}
                            </p>
                        )
                    ) : (
                        <p>
                            {t("material")}: {data.karats}K {data.metal_type}
                        </p>
                    )}
                    {!data.stones?.length ? (
                        <></>
                    ) : (
                        <p>
                            {t("gemstones")}: {data.stones.join(", ")}
                        </p>
                    )}
                </div>
                <span className="text-xl font-semibold text-foreground font-sans">{format_price(data.price, currency)}</span>
                <Link href={`/product/${data.slug}#enquire`} className="button bg-primary text-gold hover:bg-gold hover:text-primary font-secondary font-thin w-full tracking-wider text-center">
                    {t_enquiry("enquire")}
                </Link>
                <AtcBtn slug={data.slug} status={data.stock_status} />
            </div>
        </div>
    );
});
