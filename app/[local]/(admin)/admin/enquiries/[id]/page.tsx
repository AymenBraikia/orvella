import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { enquiries_collection } from "@/app/db/collections";
import { save_enquiry_notes, set_enquiry_status } from "../../actions/enquiries";
import { whatsapp_link } from "../../_lib/leads";
import { format_money } from "@/app/(site)/lib/price_format";
import { get_settings } from "@/app/server/settings";
import { Badge, Card, DetailRow, format_date, PageHeader } from "../../_components/ui";
import NotesEditor from "../../_components/notes_editor";
import StatusSelect from "../../_components/status_select";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "../../_lib/labels";
import type { Enquiry } from "@/types/enquiry";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await (await enquiries_collection()).findOne({ id: decodeURIComponent(id) }, { projection: { _id: 0 } });
    if (!doc) notFound();

    const e: Enquiry = JSON.parse(JSON.stringify(doc));
    const { store_name } = await get_settings();
    const greeting = `Hello ${e.name}, thank you for your ${e.type == "reservation" ? "reservation request" : "enquiry"} about the ${e.item.name}.`;
    const whatsapp = e.phone ? whatsapp_link(e.phone, `${greeting} — ${store_name}`) : null;

    return (
        <>
            <PageHeader title={e.name} subtitle={`${e.type == "reservation" ? "Reservation request" : "Enquiry"} · ${format_date(e.created_at, true)}`}>
                <Badge tone={LEAD_STATUS_TONE[e.status]}>{LEAD_STATUS_LABEL[e.status]}</Badge>
                <StatusSelect value={e.status} options={Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => ({ value, label }))} save={set_enquiry_status.bind(null, e.id) as (v: string) => Promise<boolean>} />
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry: ${e.item.name}`)}&body=${encodeURIComponent(`${greeting}\n\n`)}`} className="button3 bg-gold text-primary px-4! py-2! text-sm">
                    Reply by email
                </a>
                {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="button px-4! py-2! text-sm">
                        WhatsApp
                    </a>
                )}
                {e.type == "reservation" && (
                    <Link href={`/admin/products/${e.item.slug}`} className="button2 px-4! py-2! text-sm">
                        Reserve the piece →
                    </Link>
                )}
            </div>

            <div className="grid xl:grid-cols-3 gap-4 items-start">
                <Card title="Enquiry" className="xl:col-span-2">
                    <DetailRow label="Piece">
                        <Link href={`/admin/products/${e.item.slug}`} className="underline capitalize">
                            {e.item.name}
                        </Link>
                    </DetailRow>
                    <DetailRow label="Reference">{e.item.reference || "—"}</DetailRow>
                    <DetailRow label="Price when asked">{format_money(e.item.price, "EUR")}</DetailRow>
                    <DetailRow label="Message">
                        <p className="whitespace-pre-wrap">{e.message || "—"}</p>
                    </DetailRow>
                </Card>
                <div className="flex flex-col gap-4">
                    <Card title="Customer">
                        <DetailRow label="Name">{e.name}</DetailRow>
                        <DetailRow label="Email">{e.email}</DetailRow>
                        <DetailRow label="Phone">{e.phone || "—"}</DetailRow>
                        {e.locale && <DetailRow label="Language">{e.locale}</DetailRow>}
                    </Card>
                    <Card title="Internal notes">
                        <NotesEditor initial={e.notes ?? ""} save={save_enquiry_notes.bind(null, e.id)} />
                    </Card>
                </div>
            </div>
        </>
    );
}
