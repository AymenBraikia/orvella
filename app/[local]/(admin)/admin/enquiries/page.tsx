import type { Filter } from "mongodb";
import { Link } from "@/i18n/routing";
import { enquiries_collection } from "@/app/db/collections";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import { Badge, FilterBar, format_date, PageHeader, page_of, Pagination, PAGE_SIZE, SearchField, SelectFilter, Table, type Params } from "../_components/ui";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "../_lib/labels";
import type { Enquiry } from "@/types/enquiry";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;

    const filter: Filter<Enquiry> = {};
    if (params.status) filter.status = params.status as Enquiry["status"];
    if (params.type == "question" || params.type == "reservation") filter.type = params.type;
    if (params.q?.trim()) {
        const rx = { $regex: escape_regex(params.q.trim()), $options: "i" };
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { "item.name": rx }, { "item.reference": rx }] as Filter<Enquiry>[];
    }

    const collection = await enquiries_collection();
    const total = await collection.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(page_of(params), pages);
    const rows: Enquiry[] = JSON.parse(
        JSON.stringify(
            await collection
                .find(filter, { projection: { _id: 0 } })
                .sort({ created_at: -1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .toArray(),
        ),
    );

    return (
        <>
            <PageHeader title="Enquiries" subtitle="Questions and reservation requests from product pages." />

            <FilterBar>
                <SearchField value={params.q} placeholder="Name, email, piece, reference…" />
                <SelectFilter name="status" label="Status" value={params.status} options={Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
                <SelectFilter
                    name="type"
                    label="Type"
                    value={params.type}
                    options={[
                        { value: "question", label: "Question" },
                        { value: "reservation", label: "Reservation request" },
                    ]}
                />
            </FilterBar>

            <Table
                empty="No enquiries match."
                head={
                    <>
                        <th>Received</th>
                        <th>Customer</th>
                        <th>Piece</th>
                        <th>Type</th>
                        <th>Status</th>
                    </>
                }
            >
                {rows.map((e) => (
                    <tr key={e.id}>
                        <td className="whitespace-nowrap">
                            <Link href={`/admin/enquiries/${encodeURIComponent(e.id)}`} className="underline">
                                {format_date(e.created_at, true)}
                            </Link>
                        </td>
                        <td>
                            <p>{e.name}</p>
                            <p className="text-xs text-secondary">{e.email}</p>
                        </td>
                        <td className="capitalize">
                            {e.item.name}
                            {e.item.reference && <p className="text-xs text-secondary normal-case">Ref. {e.item.reference}</p>}
                        </td>
                        <td>{e.type == "reservation" ? <Badge tone="gold">Reservation</Badge> : "Question"}</td>
                        <td>
                            <Badge tone={LEAD_STATUS_TONE[e.status]}>{LEAD_STATUS_LABEL[e.status]}</Badge>
                        </td>
                    </tr>
                ))}
            </Table>

            <Pagination base="/admin/enquiries" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
