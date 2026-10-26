import { Link } from "@/i18n/routing";
import { appointments_collection } from "@/app/db/collections";
import { save_appointment_notes, set_appointment_status } from "../actions/appointments";
import { Badge, format_date, PageHeader, page_of, Pagination, PAGE_SIZE, Table, type Params } from "../_components/ui";
import StatusSelect from "../_components/status_select";
import NotesEditor from "../_components/notes_editor";
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from "../_lib/labels";
import { start_of_today } from "../_lib/overview";
import { whatsapp_link } from "../_lib/leads";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const past = params.tab == "past";
    const today = start_of_today();

    const collection = await appointments_collection();
    const filter = past ? { date: { $lt: today } } : { date: { $gte: today } };
    const total = await collection.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(page_of(params), pages);

    const docs = await collection
        .find(filter, { projection: { _id: 0 } })
        .sort({ date: past ? -1 : 1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray();
    const rows: (Appointment & { status: AppointmentStatus })[] = JSON.parse(JSON.stringify(docs)).map((a: Appointment) => ({ ...a, status: a.status ?? (a.handled ? "done" : "requested") }));

    const options = Object.entries(APPOINTMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }));

    return (
        <>
            <PageHeader title="Appointments" subtitle="Requested visits to the store, by date." />

            <div className="flex gap-2">
                <Link href="/admin/appointments" className={`px-4 py-2 text-sm border ${past ? "border-secondary/40 text-secondary" : "border-gold text-gold"}`}>
                    Upcoming
                </Link>
                <Link href="/admin/appointments?tab=past" className={`px-4 py-2 text-sm border ${past ? "border-gold text-gold" : "border-secondary/40 text-secondary"}`}>
                    Past
                </Link>
            </div>

            <Table
                empty={past ? "No past appointments." : "No upcoming appointments."}
                head={
                    <>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </>
                }
            >
                {rows.map((a) => {
                    const whatsapp = a.phone ? whatsapp_link(a.phone, `Hello ${a.firstName}, about your appointment on ${format_date(a.date)}`) : null;
                    return (
                        <tr key={a.id ?? `${a.email}-${a.created_at}`}>
                            <td className="whitespace-nowrap font-medium">{format_date(a.date)}</td>
                            <td className="min-w-48">
                                <p>
                                    {a.firstName} {a.lastName}
                                </p>
                                <p className="text-xs text-secondary">
                                    <a className="underline" href={`mailto:${a.email}?subject=${encodeURIComponent(`Your appointment on ${format_date(a.date)}`)}`}>
                                        {a.email}
                                    </a>
                                </p>
                                <p className="text-xs text-secondary">
                                    {a.phone}
                                    {whatsapp && (
                                        <>
                                            {" · "}
                                            <a href={whatsapp} target="_blank" rel="noreferrer" className="underline">
                                                WhatsApp
                                            </a>
                                        </>
                                    )}
                                </p>
                            </td>
                            <td className="max-w-80 whitespace-pre-wrap text-secondary">{a.reason || "—"}</td>
                            <td>
                                <div className="flex flex-col gap-2 items-start">
                                    <Badge tone={APPOINTMENT_STATUS_TONE[a.status]}>{APPOINTMENT_STATUS_LABEL[a.status]}</Badge>
                                    {a.id && <StatusSelect value={a.status} options={options} save={set_appointment_status.bind(null, a.id) as (v: string) => Promise<boolean>} />}
                                </div>
                            </td>
                            <td className="min-w-64">{a.id ? <NotesEditor initial={a.notes ?? ""} save={save_appointment_notes.bind(null, a.id)} /> : <span className="text-xs text-secondary">Older request without id</span>}</td>
                        </tr>
                    );
                })}
            </Table>

            <Pagination base="/admin/appointments" params={params} page={page} pages={pages} total={total} />
        </>
    );
}
