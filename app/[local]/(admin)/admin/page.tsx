import { Link } from "@/i18n/routing";
import { overview_stats } from "./_lib/overview";
import { normalize_order } from "@/app/server/orders";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, Card, format_date, PageHeader, StatCard, Table } from "./_components/ui";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./_lib/labels";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
    const stats = await overview_stats();

    return (
        <>
            <PageHeader title="Overview" subtitle="What needs your attention today." />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="New sell / consign leads" value={stats.new_leads} href="/admin/leads?status=new" />
                <StatCard label="Awaiting payment" value={stats.pending_payment} href="/admin/orders?status=pending_payment" />
                <StatCard label="Paid, to ship" value={stats.to_ship} href="/admin/orders?status=paid" />
                <StatCard label="Upcoming appointments" value={stats.upcoming} href="/admin/appointments" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Available pieces" value={stats.stock.available} href="/admin/products?status=available" />
                <StatCard label="Reserved" value={stats.stock.reserved} href="/admin/products?status=reserved" />
                <StatCard label="Sold" value={stats.stock.sold} href="/admin/products?status=sold" />
                <StatCard label="Revenue this month" value={format_money(stats.revenue_eur, "EUR")} hint={`${stats.month_order_count} paid order${stats.month_order_count == 1 ? "" : "s"} · in EUR`} />
            </div>

            <Card title="Latest orders">
                <Table
                    empty="No orders yet."
                    head={
                        <>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                        </>
                    }
                >
                    {stats.recent_orders.map((raw) => {
                        const order = normalize_order(raw);
                        return (
                            <tr key={order.id}>
                                <td>
                                    <Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="underline font-medium">
                                        {order.id}
                                    </Link>
                                </td>
                                <td>{[order.first_name, order.last_name].filter(Boolean).join(" ") || order.email}</td>
                                <td>{format_date(order.created_at)}</td>
                                <td className="tabular-nums">{format_money(order.totals.total, order.currency)}</td>
                                <td>
                                    <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            </Card>
        </>
    );
}
