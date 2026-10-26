import { Cart_Item } from "@/types/user";
import Image from "next/image";

import { format_price } from "../lib/price_format";
import { get_Currency } from "../lib/get_currency";
import { getTranslations } from "next-intl/server";

import Remove_cart_btn from "./remove_cart";
import Decrease_cart_btn from "./decrease_cart";
import Increase_cart_btn from "./increase_cart";

export default async function Item_Display(data: Cart_Item) {
    const country = await get_Currency();
    const t = await getTranslations("cart");

    const unavailable = data.stock_status != "available" || data.quantity > data.max_quantity;
    return (
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-4 border-b-foreground border-b p-4 font-secondary">
            <div className="hidden md:block">
                <Remove_cart_btn slug={data.slug} />
            </div>

            <div className="flex-center gap-4 h-full w-full md:w-fit">
                <div className="relative aspect-square min-h-30 h-full">
                    <Image fill src={data.images[0]} alt={data.slug} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" />
                </div>
                <div className="capitalize h-full md:hidden flex flex-col justify-center items-start w-full md:min-w-60">
                    {data.type == "watch" || data.type == "spare" ? (
                        <>
                            <h6 className="text-gold">{data.brand}</h6>
                            <p className="text-primary">{data.model}</p>
                        </>
                    ) : (
                        <h6>{data.display_name}</h6>
                    )}
                </div>
                <div className="md:hidden">
                    <Remove_cart_btn slug={data.slug} />
                </div>
            </div>
            <div className="flex justify-between items-center flex-col md:flex-row w-full gap-4 h-full">
                <div className="capitalize h-full hidden md:flex flex-col justify-center items-start w-full md:min-w-60">
                    {data.type == "watch" || data.type == "spare" ? (
                        <>
                            <h4 className="text-gold">{data.brand}</h4> <h6 className="text-primary">{data.model}</h6>
                        </>
                    ) : (
                        <h6 className="text-primary">{data.display_name}</h6>
                    )}
                </div>

                <div className="w-full h-full flex justify-between items-center">
                    {unavailable ? (
                        <p className="text-sm text-red-400 font-sans">{t("unavailable")}</p>
                    ) : data.max_quantity > 1 ? (
                        <div className="flex-center h-full">
                            <Increase_cart_btn quantity={data.quantity} max={data.max_quantity} slug={data.slug} />
                            <p className="aspect-square w-10 flex-center text-xl font-medium cursor-default">{data.quantity}</p>
                            <Decrease_cart_btn quantity={data.quantity} slug={data.slug} />
                        </div>
                    ) : (
                        <span></span>
                    )}

                    <p className="w-40 text-xl text-end">{format_price(data.price * data.quantity, country)}</p>
                </div>
            </div>
        </div>
    );
}
