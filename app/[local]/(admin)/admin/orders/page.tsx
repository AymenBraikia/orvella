import { Link } from "@/i18n/routing";
import { list_orders } from "../_lib/orders";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, FilterBar, format_date, PageHeader, page_of, Pagination, SearchField, SelectFilter, Table, type Params } from "../_components/ui";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../_lib/labels";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const { rows, total, pages, page } = await list_orders({ ...params, page: page_of(params) });

    return (
        <>
            <PageHeader title="Orders" subtitle="Payments, shipping and status for every order." />

            <FilterBar>
                <SearchField value={params.q} placeholder="Order number, email, name…" />
                <SelectFilter name="status" label="Status" value={params.status} options={Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
                <SelectFilter
                    name="method"
                    label="Payment"
                    value={params.method}
                    options={[
                        { value: "PayPal", label: "PayPal" },
                        { value: "Bank Transfer", label: "Bank transfer" },
                        { value: "Credit/Debit Card", label: "Card" },
                    ]}
                />
            </FilterBar>

            <Table
                empty="No orders match."
                head={
                    <>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                    </>
                }
            >
                {rows.map((order) => (
                    <tr key={order.id}>
                        <td className="whitespace-nowrap">
                            <Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="underline font-medium">
                                {order.id}
                            </Link>
                            <p className="text-xs text-secondary">
                                {order.items.length} item{order.items.length == 1 ? "" : "s"}
                            </p>
                        </td>
                        <td>
                            <p>{[order.first_name, order.last_name].filter(Boolean).join(" ") || "—"}</p>
                            <p className="text-xs text-secondary">{order.email}</p>
                        </td>
                        <td className="whitespace-nowrap">{format_date(order.created_at, true)}</td>
                        <td className="tabular-nums whitespace-nowrap">
                            {format_money(order.totals.total, order.currency)}
                            <span className="text-xs text-secondary"> {order.currency}</span>
                        </td>
                        <td className="whitespace-nowrap">{order.payment_method}</td>
                        <td>
                            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                        </td>
                    </tr>
                ))}
            </Table>

            <Pagination base="/admin/orders" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
