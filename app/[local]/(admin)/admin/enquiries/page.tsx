import { appointments_collection, consignments_collection, sell_collection } from "@/app/db/collections";
import { format_price } from "@/app/(site)/lib/price_format";
import { Appointment } from "@/types/appointment";
import { Consignment } from "@/types/consignment";
import { Sell } from "@/types/sell";

import EnquiryActions from "../components/enquiry_actions";
import { get_Currency } from "@/app/(site)/lib/get_currency";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };

function Card({ children, handled }: { children: React.ReactNode; handled: boolean }) {
    return <li className={`border border-(--foreground)/15 rounded p-4 ${handled ? "opacity-40" : ""}`}>{children}</li>;
}

export default async function AdminEnquiries() {
    const country = await get_Currency();

    const [sellsRaw, consignmentsRaw, appointmentsRaw] = await Promise.all([(await sell_collection()).find({}).toArray(), (await consignments_collection()).find({}).toArray(), (await appointments_collection()).find({}).toArray()]);

    const sells: Sell[] = JSON.parse(JSON.stringify(sellsRaw));
    const consignments: Consignment[] = JSON.parse(JSON.stringify(consignmentsRaw));
    const appointments: Appointment[] = JSON.parse(JSON.stringify(appointmentsRaw));

    const offers = [...sells, ...consignments];

    return (
        <>
            <header className="mb-8">
                <h1 className="text-2xl font-secondary">Enquiries</h1>
                <p className="opacity-50 text-sm mt-1">People offering watches, and people asking to come in.</p>
            </header>

            <section className="mb-10">
                <h2 className="text-lg mb-3 font-secondary">Sell and consign ({offers.length})</h2>

                {offers.length === 0 ? (
                    <p className="opacity-50 text-sm">Nothing yet.</p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {offers.map((offer) => (
                            <Card key={offer.id} handled={!!offer.handled}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-[0.12em] opacity-50">{offer.intent}</p>
                                        <p className="mt-1">
                                            {offer.brand} {offer.model ?? ""} {offer.refNum ? `· ref. ${offer.refNum}` : ""}
                                        </p>
                                        <p className="text-sm opacity-60 mt-0.5">
                                            {offer.condition} · asking {format_price(offer.price, country)}
                                            {offer.box ? " · box" : ""}
                                            {offer.papers ? " · papers" : ""}
                                        </p>
                                        <p className="text-sm mt-2">
                                            {offer.firstName} {offer.lastName} · {offer.email} · {offer.phone}
                                        </p>
                                        {offer.message && <p className="text-sm opacity-60 mt-2 max-w-prose">{offer.message}</p>}
                                    </div>

                                    <EnquiryActions kind={offer.intent === "sell" ? "sell" : "consignment"} id={offer.id} handled={!!offer.handled} />
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="text-lg mb-3 font-secondary">Appointments ({appointments.length})</h2>

                {appointments.length === 0 ? (
                    <p className="opacity-50 text-sm">Nothing yet.</p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {appointments.map((appointment, index) => (
                            <Card key={appointment.id ?? index} handled={!!appointment.handled}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p>
                                            {appointment.firstName} {appointment.lastName}
                                        </p>
                                        <p className="text-sm opacity-60 mt-0.5">
                                            {appointment.email} · {appointment.phone}
                                        </p>
                                        {appointment.reason && <p className="text-sm opacity-60 mt-2 max-w-prose">{appointment.reason}</p>}
                                    </div>

                                    {appointment.id && <EnquiryActions kind="appointment" id={appointment.id} handled={!!appointment.handled} />}
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}
