import { Order } from "@/types/order";
import Image from "next/image";
import { format_price } from "../lib/price_format";
import { get_Currency } from "../lib/get_currency";

export default async function Order_display({ data, last }: { data: Order; last: boolean }) {
    const country = await get_Currency();

    const address = typeof data.address == "string" ? data.address : `${data.address.city}, ${data.address.address1 + (data.address.address2 ? `, ${data.address.address2}` : "")}`;

    return (
        <div key={data.id} className={`flex-center flex-col min-w-250 w-full ${last ? "" : "border-b"} tracking-wide capitalize gap-4`}>
            <div className="w-full flex justify-between items-center gap-2 bg-secondary p-2">
                <p className="w-45">{data.id}</p>

                <p className="w-35">{new Date(data.created_at).toDateString()}</p>

                <p className="w-25">{format_price(data.amount_to_pay, country)}</p>

                <p className="w-35">{data.payment_method}</p>

                <span className="w-80">
                    <p>{address}</p>

                    {data.shipping && <p className="text-sm text-secondary">{data.shipping.carrier}</p>}
                </span>

                <p className="w-25">{data.status}</p>
            </div>

            <div className="w-full flex justify-start items-start flex-wrap gap-4 h-full p-2">
                {data.items.map((item) => (
                    <div className="flex justify-start items-start gap-4 w-[calc(33%-12px)] h-25" key={item.slug}>
                        <div className="relative h-full aspect-square">
                            <Image fill src={item?.images?.[0] || "/nah.webp"} alt={item.slug} sizes="(max-width: 768px) 80vw, 300px" className="object-cover object-center" />
                        </div>

                        <div className="w-full h-full flex flex-col justify-between items-start tracking-wider">
                            <h6 className="capitalize font-thin">{item.brand + " " + item.model}</h6>

                            <p className="text-xl">
                                {item.quantity}x · {format_price(item.price, country)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
