import Image from "next/image";
import { Link } from "@/i18n/routing";
import { list_products } from "../_lib/products";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, FilterBar, format_date, PageHeader, page_of, Pagination, SearchField, SelectFilter, Table, type Params } from "../_components/ui";
import { ITEM_STATUS_LABEL, ITEM_STATUS_TONE, ITEM_TYPE_LABEL } from "../_lib/labels";
import RowActions from "./_components/row_actions";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const { rows, total, pages, page } = await list_products({ ...params, page: page_of(params) });

    return (
        <>
            <PageHeader title="Products" subtitle="Everything in the shop: watches, jewelry and spare parts.">
                <Link href="/admin/products/new" className="button3 bg-gold text-primary px-4! py-2!">
                    + New product
                </Link>
            </PageHeader>

            <FilterBar>
                <SearchField value={params.q} placeholder="Name, brand, model, reference…" />
                <SelectFilter name="type" label="Type" value={params.type} options={Object.entries(ITEM_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
                <SelectFilter name="status" label="Status" value={params.status} options={Object.entries(ITEM_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
                <SelectFilter name="featured" label="Featured" value={params.featured} options={[{ value: "yes", label: "Featured only" }]} />
                <SelectFilter name="show" label="Show" value={params.show} options={[{ value: "deleted", label: "Deleted products" }]} />
            </FilterBar>

            <Table
                empty="No products match."
                head={
                    <>
                        <th></th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Added</th>
                        <th>Actions</th>
                    </>
                }
            >
                {rows.map((row) => (
                    <tr key={row.slug} className={row.deleted ? "opacity-60" : ""}>
                        <td className="w-16">
                            <div className="relative w-12 h-12 bg-primary overflow-hidden">{row.image && <Image src={row.image} alt="" fill sizes="48px" className="object-cover" />}</div>
                        </td>
                        <td className="min-w-56">
                            <Link href={`/admin/products/${row.slug}`} className="font-medium underline capitalize">
                                {row.name}
                            </Link>
                            <p className="text-xs text-secondary">
                                {row.reference ? `Ref. ${row.reference} · ` : ""}
                                {row.slug}
                                {row.featured ? " · ★ featured" : ""}
                            </p>
                        </td>
                        <td>{ITEM_TYPE_LABEL[row.type]}</td>
                        <td className="tabular-nums whitespace-nowrap">{format_money(row.price, "EUR")}</td>
                        <td>
                            <Badge tone={ITEM_STATUS_TONE[row.status]}>{ITEM_STATUS_LABEL[row.status]}</Badge>
                            {row.type == "spare" && <p className="text-xs text-secondary mt-1">{row.available} in stock</p>}
                        </td>
                        <td className="whitespace-nowrap">{format_date(row.date_added)}</td>
                        <td>
                            <RowActions slug={row.slug} status={row.status} featured={row.featured} deleted={row.deleted} />
                        </td>
                    </tr>
                ))}
            </Table>

            <Pagination base="/admin/products" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
