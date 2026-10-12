import Image from "next/image";
import { format_price } from "../lib/price_format";
import { getTranslations } from "next-intl/server";
import { User_Cart } from "@/types/user";
import { Supported_Currencies } from "@/currency";

export default async function Items({ currency, items }: { items: User_Cart; currency: Supported_Currencies }) {
    const t = await getTranslations("checkout");
    return (
        <div className="flex flex-col justify-start items-start w-full max-h-[50dvh] border-b">
            <div className="sm:flex hidden justify-between items-center font-medium w-full text-xl gap-4 p-2 capitalize border-b">
                <p className="min-w-30 w-full">{t("watchSpare")}</p>
            </div>
            <div className="w-full max-h-full overflow-y-auto overflow-x-hidden gap-2 flex flex-col justify-start items-start py-2">
                {items.map((i, c) => (
                    <div key={i.slug} className={`flex justify-between items-center gap-4 h-25 shrink-0 sm:h-fit w-full pe-4 pb-2 ${items.length - 1 != c ? "border-b" : ""}`}>
                        <div className="relative aspect-square sm:h-25 h-full">
                            <Image src={i.images[0]} alt={i.slug} fill sizes="25vw" />
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-4 h-full w-full">
                            <div className="w-full flex justify-inset-s-items-start gap-2 tracking-wider capitalize">
                                <h6 className="text-shine">{i.brand + " " + i.model}</h6>
                            </div>
                            <p className="text-base font-medium min-w-20 max-w-30 block font-sans">Quantity: {i.quantity}</p>
                            <p className="text-base sm:text-base font-medium w-fit sm:w-25 font-sans">{format_price(i.price * i.quantity, currency)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
