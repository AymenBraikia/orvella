import { Link } from "@/i18n/routing";
import { list_leads } from "../_lib/leads";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, FilterBar, format_date, PageHeader, page_of, Pagination, SearchField, SelectFilter, Table, type Params } from "../_components/ui";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "../_lib/labels";

export const metadata = { title: "Sell / Consign leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const { rows, total, pages, page } = await list_leads({ ...params, page: page_of(params) });

    return (
        <>
            <PageHeader title="Sell / Consign" subtitle="Watches customers want to sell to you or consign with you." />

            <FilterBar>
                <SearchField value={params.q} placeholder="Name, email, brand, model, reference…" />
                <SelectFilter name="status" label="Status" value={params.status} options={Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
                <SelectFilter
                    name="intent"
                    label="Request"
                    value={params.intent}
                    options={[
                        { value: "sell", label: "Sell" },
                        { value: "consign", label: "Consign" },
                    ]}
                />
            </FilterBar>

            <Table
                empty="No requests match."
                head={
                    <>
                        <th>Received</th>
                        <th>Customer</th>
                        <th>Request</th>
                        <th>Watch</th>
                        <th>Asking</th>
                        <th>Photos</th>
                        <th>Status</th>
                    </>
                }
            >
                {rows.map((lead) => (
                    <tr key={lead.id}>
                        <td className="whitespace-nowrap">
                            <Link href={`/admin/leads/${encodeURIComponent(lead.id)}`} className="underline">
                                {format_date(lead.created_at, true)}
                            </Link>
                        </td>
                        <td>
                            <p>
                                {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-xs text-secondary">{lead.email}</p>
                        </td>
                        <td>{lead.intent == "consign" ? "Consign" : "Sell"}</td>
                        <td className="capitalize">
                            {[lead.brand, lead.model].filter(Boolean).join(" ")}
                            {lead.refNum && <p className="text-xs text-secondary normal-case">Ref. {lead.refNum}</p>}
                        </td>
                        <td className="tabular-nums whitespace-nowrap">{lead.price ? format_money(lead.price, "EUR") : "—"}</td>
                        <td>{lead.images.length}</td>
                        <td>
                            <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>
                        </td>
                    </tr>
                ))}
            </Table>

            <Pagination base="/admin/leads" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
