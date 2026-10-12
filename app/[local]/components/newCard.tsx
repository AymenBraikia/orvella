"use client";
import { Watch } from "@/types/watch";
import Image from "next/image";
import AtcBtn from "./buttons/addToCart";
import { format_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import { useState } from "react";
import dynamic from "next/dynamic";
import { read_cookie } from "../(site)/lib/read_cookie";
import { Supported_Currencies } from "@/currency";

const QuickViewModal = dynamic(() => import("./quick_view"), {
    ssr: false,
});

export default function Card({ data }: { data: Watch }) {
    const t_btn = useTranslations("common.buttons");
    const [view, set_view] = useState<null | Watch>(null);

    
    return (
        <>
            <div aria-label={`${data.brand + " " + data.model}`} className="h-fit sm:h-110 w-full flex flex-col justify-start items-start gap-4 transition-long group" key={data.slug} onClick={() => innerWidth < 1536 && set_view(data)}>
                <div className="relative w-full sm:h-fit flex-center overflow-hidden aspect-square">
                    <Image
                        src={data.images[0]}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        fill
                        alt={data.brand + " " + data.model}
                        className="object-contain select-none scale-100 brightness-100 transition-long group-hover:scale-105 group-hover:brightness-50"
                    />
                    <div className="2xl:flex-center relative w-full h-15 fade-out group-hover:fade-in transition-long hidden gap-4 z-10">
                        <button
                            aria-label={`quick view ${data.brand + " " + data.model}`}
                            type="button"
                            className="button cursor-pointer p-4 select-none transition-default capitalize min-w-fit whitespace-nowrap text-sm h-fit"
                            onClick={() => set_view(data)}
                        >
                            {t_btn("quick_view")}
                        </button>
                        <div className="w-fit text-white hover:text-foreground transition-default capitalize min-w-fit whitespace-nowrap text-sm">
                            <AtcBtn slug={data.slug} />
                        </div>
                    </div>
                </div>
                <div className="w-full flex flex-col justify-start items-start max-h-30 min-h-20">
                    <h5 className="sm:title6 title4 font-secondary capitalize text-shine">{data.brand + " " + data.model}</h5>
                    <h6 className="sm:title6 title5 font-secondary">{format_price(data.price, read_cookie("Currency") as Supported_Currencies)}</h6>
                </div>
            </div>
            <QuickViewModal view={view} onClose={() => set_view(null)} />
        </>
    );
}
