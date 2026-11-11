import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { get_demo } from "@/app/server/private_demos";
import { enquiries_collection } from "@/app/db/collections";
import { absolute_url } from "@/app/(site)/lib/site_url";
import { Badge, Card, DetailRow, format_date, PageHeader } from "../../_components/ui";
import DemoForm from "../_components/demo_form";
import DemoControls from "../_components/demo_controls";
import CopyLink from "../_components/copy_link";

export const metadata = { title: "Private demo" };

export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
    const demo = await get_demo((await params).id);
    if (!demo) notFound();

    const enquiries = await (await enquiries_collection()).countDocuments({ "demo.id": demo.id });

    return (
        <>
            <PageHeader title={demo.name} subtitle={`Created ${format_date(demo.created_at, true)}`}>
                {demo.enabled ? <Badge tone="green">Live</Badge> : <Badge>Disabled — the link shows a 404</Badge>}
                <DemoControls id={demo.id} enabled={demo.enabled} />
            </PageHeader>

            <Card title="Share">
                <DetailRow label="Link">
                    <CopyLink url={absolute_url(`/${demo.slug}`)} />
                </DetailRow>
                <DetailRow label="Views">{demo.views} (people only: not you, not link previews)</DetailRow>
                <DetailRow label="First opened">{demo.first_opened_at ? format_date(demo.first_opened_at, true) : "Not yet"}</DetailRow>
                <DetailRow label="Last opened">{demo.last_opened_at ? format_date(demo.last_opened_at, true) : "—"}</DetailRow>
                <DetailRow label="Enquiries">
                    {enquiries ? (
                        <Link href={`/admin/enquiries?q=${encodeURIComponent(demo.name)}`} className="underline">
                            {enquiries} received
                        </Link>
                    ) : (
                        "None yet"
                    )}
                </DetailRow>
            </Card>

            <DemoForm id={demo.id} initial={demo} is_new={false} />
        </>
    );
}
