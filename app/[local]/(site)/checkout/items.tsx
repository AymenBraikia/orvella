import Image from "next/image";
import { format_money } from "../lib/price_format";
import { getTranslations } from "next-intl/server";
import type { OrderLine } from "@/types/order";

export default async function Items({ currency, lines }: { lines: OrderLine[]; currency: string }) {
    const t = await getTranslations("checkout");
    return (
        <div className="flex flex-col justify-start items-start w-full max-h-[50dvh] border-b">
            <div className="sm:flex hidden justify-between items-center font-medium w-full text-xl gap-4 p-2 capitalize border-b">
                <p className="min-w-30 w-full">{t("watchSpare")}</p>
            </div>
            <div className="w-full max-h-full overflow-y-auto overflow-x-hidden gap-2 flex flex-col justify-start items-start py-2">
                {lines.map((i, c) => (
                    <div key={i.slug} className={`flex justify-between items-center gap-4 h-25 shrink-0 sm:h-fit w-full pe-4 pb-2 ${lines.length - 1 != c ? "border-b" : ""}`}>
                        <div className="relative aspect-square sm:h-25 h-full">{i.image && <Image src={i.image} alt={i.name} fill sizes="25vw" />}</div>

                        <div className="flex justify-between items-center flex-wrap gap-4 h-full w-full">
                            <div className="w-full flex justify-inset-s-items-start gap-2 tracking-wider capitalize">
                                <h6 className="text-gold">{i.name}</h6>
                            </div>
                            <p className="text-base font-medium min-w-20 max-w-30 block font-sans">
                                {t("qty")}: {i.quantity}
                            </p>
                            <p className="text-base sm:text-base font-medium w-fit sm:w-25 font-sans">{format_money(i.total, currency)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
