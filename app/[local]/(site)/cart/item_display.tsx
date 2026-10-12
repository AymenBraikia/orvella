import Cross from "@/app/components/svg/cross";
import decrease_cart from "@/app/server/cart_decrease";
import increase_cart from "@/app/server/cart_increase";
import revmove_from_cart from "@/app/server/remove_cart";
import { Cart_Item } from "@/types/user";
import Image from "next/image";
import { format_price } from "../lib/price_format";
import { get_Currency } from "../lib/get_currency";

export default async function Item_Display({ brand, model, slug, price, quantity, images, reference }: Cart_Item) {
    const country = await get_Currency();
    return (
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-4 border-b-foreground border-b p-4 font-secondary">
            <button type="button" className="hidden md:flex button2 p-0" onClick={() => revmove_from_cart(reference)}>
                <Cross classnames="w-8" />
            </button>

            <div className="flex-center gap-4 h-full w-full md:w-fit">
                <div className="relative aspect-square min-h-30 h-full">
                    <Image fill src={images[0]} alt={slug} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" />
                </div>
                <div className="capitalize h-full md:hidden flex flex-col justify-center items-start w-full md:min-w-60">
                    <h6>{brand}</h6>
                    <p className="text-secondary">{model}</p>
                </div>
                <button type="button" className="md:hidden button2 p-0" onClick={() => revmove_from_cart(reference)}>
                    <Cross classnames="w-8" />
                </button>
            </div>

            <div className="flex justify-between items-center flex-col md:flex-row w-full gap-4 h-full">
                <div className="capitalize h-full hidden md:flex flex-col justify-center items-start w-full md:min-w-60">
                    <h4>{brand}</h4>
                    <h6 className="text-secondary">{model}</h6>
                </div>

                <div className="w-full h-full flex justify-between items-center">
                    <div className="flex-center">
                        <button onClick={() => quantity < 10 && increase_cart(reference)} className={`button aspect-square w-10 p-0 h-fit font-bold text-xl ${quantity < 10 ? "" : "brightness-75 cursor-not-allowed"}`}>
                            +
                        </button>
                        <p className="aspect-square w-10 flex-center text-xl font-medium cursor-default">{quantity}</p>
                        <button onClick={() => quantity > 1 && decrease_cart(reference)} className={`button aspect-square w-10 p-0 h-fit font-bold text-xl ${quantity > 1 ? "" : "brightness-75 cursor-not-allowed"}`}>
                            -
                        </button>
                    </div>

                    <p className="w-40 text-xl text-end">{format_price(price * quantity, country)}</p>
                </div>
            </div>
        </div>
    );
}
