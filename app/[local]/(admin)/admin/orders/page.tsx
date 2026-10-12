import { orders_collection } from "@/app/db/collections";
import { format_price } from "@/app/(site)/lib/price_format";
import { Order } from "@/types/order";

import OrderStatus from "../components/order_status";
import { get_Currency } from "@/app/(site)/lib/get_currency";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrders() {
    const raw = await (await orders_collection()).find({}).sort({ created_at: -1 }).toArray();
    const orders: Order[] = JSON.parse(JSON.stringify(raw));
    const country = await get_Currency();

    return (
        <>
            <header className="mb-6">
                <h1 className="text-2xl font-secondary">Orders</h1>
                <p className="opacity-50 text-sm mt-1">{orders.length} total</p>
            </header>

            {orders.length === 0 ? (
                <p className="opacity-50 text-sm">No orders yet.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {orders.map((order) => (
                        <li key={order.id} className="border border-(--foreground)/15 rounded p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-mono text-xs opacity-50">{order.id}</p>
                                    <p className="mt-1">{order.email}</p>
                                    <p className="text-xs opacity-50 mt-0.5">
                                        {new Date(order.created_at).toLocaleDateString()} · {order.payment_method}
                                    </p>
                                </div>

                                <div className="text-end">
                                    <p>{format_price(order.amount_to_pay, country)}</p>
                                    <div className="mt-1">
                                        <OrderStatus id={order.id} status={order.status} />
                                    </div>
                                </div>
                            </div>

                            <ul className="mt-3 pt-3 border-t border-(--foreground)/10 flex flex-col gap-1 text-sm opacity-70">
                                {order.items.map((item) => (
                                    <li key={item.slug} className="flex justify-between gap-4">
                                        <span className="truncate">
                                            {item.quantity} x {item.brand} {item.model}
                                        </span>
                                        <span className="whitespace-nowrap">{format_price(item.price * item.quantity, country)}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-3 text-xs opacity-50">{order.address === "Local Pickup" ? "Local pickup" : `${order.address.address1}, ${order.address.city} ${order.address.postCode}, ${order.address.country}`}</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
