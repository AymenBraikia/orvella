import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { users_collection } from "@/app/db/collections";
import { orders_for_email } from "@/app/server/orders";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, Card, DetailRow, format_date, PageHeader, Table } from "../../_components/ui";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../../_lib/labels";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ email: string }> }) {
    const email = decodeURIComponent((await params).email);

    const user = await (await users_collection()).findOne({ email }, { projection: { email: 1, firstName: 1, lastName: 1, admin: 1, address: 1 } });
    if (!user) notFound();

    const orders = await orders_for_email(email, true);
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const address = user.address;

    return (
        <>
            <PageHeader title={name || user.email} subtitle={`Customer since ${format_date(user._id.getTimestamp())}`}>
                {user.admin && <Badge tone="gold">Admin</Badge>}
            </PageHeader>

            <div className="grid xl:grid-cols-3 gap-4 items-start">
                <Card title="Contact" className="xl:col-span-1">
                    <DetailRow label="Email">
                        <a className="underline" href={`mailto:${user.email}`}>
                            {user.email}
                        </a>
                    </DetailRow>
                    <DetailRow label="Phone">{address?.phone || "—"}</DetailRow>
                    <DetailRow label="Address on file">{address?.address1 ? [address.address1, address.address2, `${address.postCode ?? ""} ${address.city ?? ""}`.trim(), address.country].filter(Boolean).join(", ") : "—"}</DetailRow>
                </Card>

                <Card title={`Orders (${orders.length})`} className="xl:col-span-2">
                    <Table
                        empty="No orders yet."
                        head={
                            <>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                            </>
                        }
                    >
                        {orders.map((o) => (
                            <tr key={o.id}>
                                <td>
                                    <Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="underline">
                                        {o.id}
                                    </Link>
                                </td>
                                <td className="whitespace-nowrap">{format_date(o.created_at)}</td>
                                <td className="tabular-nums">{format_money(o.totals.total, o.currency)}</td>
                                <td>
                                    <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </Card>
            </div>
        </>
    );
}
