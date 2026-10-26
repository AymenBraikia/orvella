import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { get_order } from "../../_lib/orders";
import { save_order_notes } from "../../actions/orders";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, Card, DetailRow, format_date, PageHeader } from "../../_components/ui";
import NotesEditor from "../../_components/notes_editor";
import StatusActions from "../_components/status_actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../../_lib/labels";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await get_order(decodeURIComponent(id));
    if (!order) notFound();

    const { totals, currency, tax } = order;
    const money = (n: number) => format_money(n, currency);
    const name = [order.first_name, order.last_name].filter(Boolean).join(" ");

    return (
        <>
            <PageHeader title={order.id} subtitle={`Placed ${format_date(order.created_at, true)} · ${order.payment_method}`}>
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </PageHeader>

            {order.stock_conflicts?.length ? (
                <p role="alert" className="border border-red-400 text-red-400 p-3 text-sm">
                    Stock warning: these pieces were no longer available when the payment arrived — {order.stock_conflicts.join(", ")}. Contact the customer and refund or offer an alternative.
                </p>
            ) : null}

            <div className="grid xl:grid-cols-3 gap-4 items-start">
                <div className="xl:col-span-2 flex flex-col gap-4">
                    <Card title="Items">
                        <div className="flex flex-col divide-y divide-secondary/20">
                            {order.items.map((item) => (
                                <div key={item.slug} className="flex items-center gap-4 py-3">
                                    <div className="relative w-16 h-16 shrink-0 bg-primary">{item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/admin/products/${item.slug}`} className="underline capitalize">
                                            {item.name}
                                        </Link>
                                        <p className="text-xs text-secondary">
                                            {item.reference ? `Ref. ${item.reference} · ` : ""}
                                            {item.quantity} × {money(item.unit_price)}
                                            {currency != "EUR" ? ` (catalogue €${item.unit_price_eur})` : ""}
                                        </p>
                                    </div>
                                    <p className="tabular-nums">{money(item.total)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1 text-sm border-t border-secondary/30 pt-3">
                            <Row label="Subtotal" value={money(totals.items)} />
                            <Row label={order.address == "Local Pickup" ? "Local pickup" : `Shipping${order.shipping ? ` (${order.shipping.carrier})` : ""}`} value={money(totals.shipping)} />
                            {totals.discount > 0 && <Row label="Discount" value={`− ${money(totals.discount)}`} />}
                            {tax.mode == "added" && <Row label={`VAT ${tax.rate}%`} value={money(totals.tax)} />}
                            <Row label="Total" value={money(totals.total)} strong />
                            {tax.mode == "included" && <Row label={`Includes VAT ${tax.rate}%`} value={money(totals.tax_included)} muted />}
                            {tax.mode == "margin_scheme" && <p className="text-xs text-secondary">Margin scheme according to §25a UStG — no VAT shown separately.</p>}
                            {currency != "EUR" && <p className="text-xs text-secondary">Charged in {currency} at 1 EUR = {order.exchange_rate} {currency}.</p>}
                        </div>
                    </Card>

                    <Card title="Status">
                        <StatusActions id={order.id} status={order.status} payment_method={order.payment_method} />
                        <ol className="flex flex-col gap-2 border-t border-secondary/30 pt-3 text-sm">
                            {[...order.status_history].reverse().map((e, i) => (
                                <li key={i} className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span className="text-secondary tabular-nums">{format_date(e.at, true)}</span>
                                    <span className="font-medium">{ORDER_STATUS_LABEL[e.status] ?? e.status}</span>
                                    {e.note && <span className="text-secondary">— {e.note}</span>}
                                    {e.by && <span className="text-secondary">({e.by})</span>}
                                </li>
                            ))}
                        </ol>
                    </Card>
                </div>

                <div className="flex flex-col gap-4">
                    <Card title="Customer">
                        <DetailRow label="Name">{name || "—"}</DetailRow>
                        <DetailRow label="Email">
                            <a className="underline" href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.id}`)}`}>
                                {order.email}
                            </a>
                        </DetailRow>
                        <DetailRow label="Phone">{order.phone || "—"}</DetailRow>
                        <DetailRow label="Delivery">
                            {order.address == "Local Pickup" ? (
                                "Local pickup in store"
                            ) : (
                                <address className="not-italic">
                                    {order.address.address1}
                                    {order.address.address2 && <br />}
                                    {order.address.address2}
                                    <br />
                                    {order.address.postCode} {order.address.city}
                                    <br />
                                    {order.address.country}
                                </address>
                            )}
                        </DetailRow>
                        <Link href={`/admin/orders?email=${encodeURIComponent(order.email)}`} className="text-xs underline text-secondary">
                            All orders from this customer
                        </Link>
                    </Card>

                    <Card title="Payment">
                        <DetailRow label="Method">{order.payment_method}</DetailRow>
                        {order.paypal_order_id && <DetailRow label="PayPal order">{order.paypal_order_id}</DetailRow>}
                        {order.paypal_capture_id && <DetailRow label="PayPal capture">{order.paypal_capture_id}</DetailRow>}
                        {order.status == "pending_payment" && order.reserved_until && <DetailRow label="Pieces held until">{format_date(order.reserved_until, true)}</DetailRow>}
                        {order.tracking && (
                            <DetailRow label="Tracking">
                                {order.tracking.carrier} · {order.tracking.number}
                            </DetailRow>
                        )}
                        {order.locale && <DetailRow label="Customer language">{order.locale}</DetailRow>}
                    </Card>

                    <Card title="Internal notes">
                        <NotesEditor initial={order.admin_notes ?? ""} save={save_order_notes.bind(null, order.id)} />
                    </Card>
                </div>
            </div>
        </>
    );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
    return (
        <div className={`flex justify-between gap-4 ${strong ? "font-semibold text-gold text-base" : ""} ${muted ? "text-xs text-secondary" : ""}`}>
            <span>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}
