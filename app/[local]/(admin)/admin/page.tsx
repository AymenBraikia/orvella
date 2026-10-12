import Link from "next/link";

import { format_price } from "@/app/(site)/lib/price_format";
import { get_admin_stats, get_recent_orders } from "@/app/server/admin/stats";
import { get_Currency } from "@/app/(site)/lib/get_currency";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="border border-(--foreground)/15 rounded p-4">
            <p className="text-xs uppercase tracking-[0.15em] opacity-50">{label}</p>
            <p className="text-2xl mt-2 font-secondary">{value}</p>
            {hint && <p className="text-xs opacity-40 mt-1">{hint}</p>}
        </div>
    );
}

export default async function AdminDashboard() {
    const [stats, orders] = await Promise.all([get_admin_stats(), get_recent_orders()]);
    const country = await get_Currency();

    return (
        <>
            <header className="mb-8">
                <h1 className="text-2xl font-secondary">Dashboard</h1>
                <p className="opacity-50 text-sm mt-1">Everything at a glance.</p>
            </header>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                <Stat label="Watches" value={String(stats.watches)} hint={`${stats.inStock} in stock`} />
                <Stat label="Stock value" value={format_price(stats.stockValue, country)} hint="In-stock watches" />
                <Stat label="Revenue" value={format_price(stats.revenue, country)} hint="Completed orders" />
                <Stat label="Orders" value={String(stats.orders)} hint={`${stats.pendingOrders} pending`} />
                <Stat label="Spare parts" value={String(stats.spares)} />
                <Stat label="Customers" value={String(stats.users)} />
                <Stat label="Open enquiries" value={String(stats.openEnquiries)} hint="Sell, consign, appointments" />
                <Link href="/admin/watches/new" className="border border-dashed border-(--foreground)/30 rounded p-4 flex items-center justify-center text-sm hover:bg-secondary transition-colors duration-300">
                    + Add a watch
                </Link>
            </section>

            <section>
                <h2 className="text-lg mb-3 font-secondary">Recent orders</h2>

                {orders.length === 0 ? (
                    <p className="opacity-50 text-sm">No orders yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Email</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="font-mono text-xs">{order.id.slice(0, 12)}</td>
                                        <td>{order.email}</td>
                                        <td>{format_price(order.amount_to_pay, country)}</td>
                                        <td>{order.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
