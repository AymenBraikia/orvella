"use client";
import AtcBtn from "./buttons/addToCart";
import { item_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useCurrency } from "../(site)/context/currencyContext";
import { Item } from "../(site)/lib/filters";
import StockBadge from "./stock_badge";
import { item_name } from "../(site)/lib/item_name";
import ProductCardView from "./product_card_view";

const QuickViewModal = dynamic(() => import("./quick_view"), {
    ssr: false,
});

export default function Card({ data }: { data: Item }) {
    const t_btn = useTranslations("common.buttons");
    const t = useTranslations("common");
    const currency = useCurrency();
    const [view, set_view] = useState<null | Item>(null);

    return (
        <>
            <ProductCardView
                name={item_name(data)}
                price={item_price(data.price, currency, t("priceOnRequest"))}
                image={data.images[0]}
                onClick={() => innerWidth < 1536 && set_view(data)}
                badge={<StockBadge status={data.stock_status} />}
                actions={
                    <div className="2xl:flex-center relative w-full h-15 fade-out group-hover:fade-in transition-long hidden gap-4 z-10">
                        <button
                            aria-label={`quick view ${item_name(data)}`}
                            type="button"
                            className="button cursor-pointer p-4 select-none transition-default capitalize min-w-fit whitespace-nowrap text-sm h-fit"
                            onClick={() => set_view(data)}
                        >
                            {t_btn("quick_view")}
                        </button>
                        <div className="w-fit text-white hover:text-foreground transition-default capitalize min-w-fit whitespace-nowrap text-sm">
                            <AtcBtn slug={data.slug} status={data.stock_status} />
                        </div>
                    </div>
                }
            />
            <QuickViewModal view={view} onClose={() => set_view(null)} />
        </>
    );
}
