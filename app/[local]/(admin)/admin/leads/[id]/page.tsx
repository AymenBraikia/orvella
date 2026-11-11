import Image from "next/image";
import { notFound } from "next/navigation";
import { find_lead, whatsapp_link } from "../../_lib/leads";
import { save_lead_notes, set_lead_status } from "../../actions/leads";
import { format_money } from "@/app/(site)/lib/price_format";
import { Badge, Card, DetailRow, format_date, PageHeader } from "../../_components/ui";
import NotesEditor from "../../_components/notes_editor";
import StatusSelect from "../../_components/status_select";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "../../_lib/labels";
import { get_settings } from "@/app/server/settings";

export const metadata = { title: "Sell / Consign request" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const found = await find_lead(decodeURIComponent(id));
    if (!found) notFound();

    const { lead } = found;
    const { store_name } = await get_settings();

    const watch = [lead.brand, lead.model].filter(Boolean).join(" ");
    const kind = lead.intent == "consign" ? "consignment" : "sell";
    const subject = `Your ${kind} request: ${watch}`;
    const greeting = `Hello ${lead.firstName}, thank you for your ${kind} request for your ${watch}.`;
    const whatsapp = whatsapp_link(lead.phone, `${greeting} — ${store_name}`);

    return (
        <>
            <PageHeader title={`${lead.firstName} ${lead.lastName}`} subtitle={`${lead.intent == "consign" ? "Consignment" : "Sell"} request · ${format_date(lead.created_at, true)}`}>
                <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>
                <StatusSelect value={lead.status} options={Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => ({ value, label }))} save={set_lead_status.bind(null, lead.id) as (v: string) => Promise<boolean>} />
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                <a href={`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${greeting}\n\n`)}`} className="button3 bg-gold text-primary px-4! py-2! text-sm">
                    Reply by email
                </a>
                {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="button px-4! py-2! text-sm">
                        WhatsApp
                    </a>
                )}
                {lead.phone && (
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="button2 px-4! py-2! text-sm">
                        Call {lead.phone}
                    </a>
                )}
            </div>

            <div className="grid xl:grid-cols-3 gap-4 items-start">
                <div className="xl:col-span-2 flex flex-col gap-4">
                    <Card title={`Photos (${lead.images.length})`}>
                        {lead.images.length ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {lead.images.map((src, i) => (
                                    <a key={src} href={src} target="_blank" rel="noreferrer" className="relative aspect-square bg-primary block">
                                        <Image src={src} alt={`Photo ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-secondary">No photos attached.</p>
                        )}
                    </Card>

                    <Card title="Watch">
                        <DetailRow label="Brand">{lead.brand}</DetailRow>
                        <DetailRow label="Model">{lead.model || "—"}</DetailRow>
                        <DetailRow label="Reference">{lead.refNum || "—"}</DetailRow>
                        <DetailRow label="Condition">{lead.condition}</DetailRow>
                        <DetailRow label="Box / papers">{[lead.box && "Box", lead.papers && "Papers"].filter(Boolean).join(", ") || "Neither"}</DetailRow>
                        <DetailRow label="Asking price">{lead.price ? format_money(lead.price, "EUR") : "—"}</DetailRow>
                        <DetailRow label="Message">
                            <p className="whitespace-pre-wrap">{lead.message || "—"}</p>
                        </DetailRow>
                    </Card>
                </div>

                <div className="flex flex-col gap-4">
                    <Card title="Customer">
                        <DetailRow label="Name">
                            {lead.firstName} {lead.lastName}
                        </DetailRow>
                        <DetailRow label="Email">{lead.email}</DetailRow>
                        <DetailRow label="Phone">{lead.phone}</DetailRow>
                        {lead.locale && <DetailRow label="Language">{lead.locale}</DetailRow>}
                    </Card>
                    <Card title="Internal notes">
                        <NotesEditor initial={lead.notes ?? ""} save={save_lead_notes.bind(null, lead.id)} />
                    </Card>
                </div>
            </div>
        </>
    );
}
