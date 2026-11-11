import { Link } from "@/i18n/routing";
import { orders_collection, users_collection } from "@/app/db/collections";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, FilterBar, format_date, PageHeader, page_of, Pagination, PAGE_SIZE, SearchField, Table, type Params } from "../_components/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;

    const filter = params.q?.trim() ? { $or: ["email", "firstName", "lastName"].map((f) => ({ [f]: { $regex: escape_regex(params.q!.trim()), $options: "i" } })) } : {};

    const users = await users_collection();
    const total = await users.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(page_of(params), pages);

    // Read-only on purpose: no passwords, carts or flags are ever sent to this page.
    const docs = await users
        .find(filter, { projection: { email: 1, firstName: 1, lastName: 1, admin: 1 } })
        .sort({ _id: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray();

    const emails = docs.map((d) => d.email);
    const stats = await (
        await orders_collection()
    )
        .aggregate<{ _id: string; count: number; spent_eur: number; last: Date }>([
            { $match: { email: { $in: emails } } },
            {
                $group: {
                    _id: "$email",
                    count: { $sum: 1 },
                    last: { $max: "$created_at" },
                    spent_eur: { $sum: { $cond: [{ $in: ["$status", ["paid", "shipped", "delivered", "Completed"]] }, { $divide: [{ $ifNull: ["$totals.total", { $ifNull: ["$amount_to_pay", 0] }] }, { $ifNull: ["$exchange_rate", 1] }] }, 0] } },
                },
            },
        ])
        .toArray();
    const by_email = new Map(stats.map((s) => [s._id, s]));

    return (
        <>
            <PageHeader title="Customers" subtitle="Registered accounts and what they bought. Read-only." />

            <FilterBar>
                <SearchField value={params.q} placeholder="Name or email…" />
            </FilterBar>

            <Table
                empty="No customers match."
                head={
                    <>
                        <th>Customer</th>
                        <th>Joined</th>
                        <th>Orders</th>
                        <th>Spent (paid, EUR)</th>
                        <th>Last order</th>
                    </>
                }
            >
                {docs.map((u) => {
                    const s = by_email.get(u.email);
                    return (
                        <tr key={u.email}>
                            <td>
                                <Link href={`/admin/customers/${encodeURIComponent(u.email)}`} className="underline">
                                    {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                                </Link>
                                {u.admin && (
                                    <span className="ms-2">
                                        <Badge tone="gold">Admin</Badge>
                                    </span>
                                )}
                                <p className="text-xs text-secondary">{u.email}</p>
                            </td>
                            <td className="whitespace-nowrap">{format_date(u._id.getTimestamp())}</td>
                            <td>{s?.count ?? 0}</td>
                            <td className="tabular-nums">{format_money(s?.spent_eur ?? 0, "EUR")}</td>
                            <td className="whitespace-nowrap">{s?.last ? format_date(s.last) : "—"}</td>
                        </tr>
                    );
                })}
            </Table>

            <Pagination base="/admin/customers" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
