import { Link } from "@/i18n/routing";
import { list_demos } from "@/app/server/private_demos";
import { absolute_url } from "@/app/(site)/lib/site_url";
import { Badge, format_date, PageHeader, Table } from "../_components/ui";
import CopyLink from "./_components/copy_link";

export const metadata = { title: "Private demos" };

export default async function DemosPage() {
    const demos = await list_demos();

    return (
        <>
            <PageHeader title="Private demos" subtitle="One seller's pieces at corlane.store/<address>. Never listed, linked or indexed; only people with the link can open it.">
                <Link href="/admin/demos/new" className="button3 bg-gold text-primary px-4! py-2! text-sm">
                    New demo
                </Link>
            </PageHeader>

            <Table
                empty="No demos yet. Create one for your next lead."
                head={
                    <>
                        <th>Seller</th>
                        <th>Link</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>First opened</th>
                    </>
                }
            >
                {demos.map((d) => (
                    <tr key={d.id}>
                        <td>
                            <Link href={`/admin/demos/${d.id}`} className="underline">
                                {d.name}
                            </Link>
                            <p className="text-xs text-secondary capitalize">
                                {d.category} · {d.language.toUpperCase()} · {d.pieces.length} pieces
                            </p>
                        </td>
                        <td>
                            <CopyLink url={absolute_url(`/${d.slug}`)} />
                        </td>
                        <td className="whitespace-nowrap">{format_date(d.created_at)}</td>
                        <td>{d.enabled ? <Badge tone="green">Live</Badge> : <Badge>Disabled</Badge>}</td>
                        <td className="tabular-nums">{d.views}</td>
                        <td className="whitespace-nowrap">{d.first_opened_at ? format_date(d.first_opened_at, true) : <span className="text-secondary">Not yet</span>}</td>
                    </tr>
                ))}
            </Table>
        </>
    );
}
