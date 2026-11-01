import Link from "next/link";
import Map from "./map";
import Gallery from "./gallery";
import { getTranslations } from "next-intl/server";
import { shown_contact, store_identity } from "@/app/server/store_identity";
import { WEEKDAYS } from "@/types/settings";

export default async function StorePage() {
    const t = await getTranslations("store");
    const t_footer = await getTranslations("common.footer");
    const store = await store_identity();
    const contact = shown_contact(store);
    const address = [contact.address.street, `${contact.address.postcode} ${contact.address.city}`, contact.address.country].filter((s) => s.trim()).join(", ");

    return (
        <div className="flex justify-start items-start flex-wrap w-full gap-10 py-20 px-5 md:px-10 xl:px-20">
            <h1>{t("heading", { city: contact.address.city }).trim()}</h1>

            <div className="w-full flex justify-between items-start flex-col-reverse lg:flex-col xl:flex-row gap-10 xl:gap-0">
                <div className="w-full xl:w-[calc(50%-20px)]">
                    <div className="flex justify-center items-start flex-col gap-6 text-sm">
                        <Link className="title6 underline" href={"/booking"}>
                            {t("cta")}
                        </Link>
                        <p>{t("welcomeText")}</p>
                        <p>{t("appointmentNote")}</p>
                        <p>{t("highValueNote")}</p>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:flex-wrap w-full mt-10 tracking-wider gap-10">
                        <div className="flex flex-col w-full lg:w-[calc(33%-25px)] xl:w-[calc(50%-30px)] gap-10 text-sm">
                            <h5>{t("addressHeading")}</h5>
                            <div className="flex flex-col gap-5">
                                <p>{address || t_footer("byAppointment")}</p>
                                {store.parking_url && (
                                    <p>
                                        {t("parkingText")}{" "}
                                        <Link className="underline" href={store.parking_url} target="_blank" rel="noreferrer">
                                            {t("parkingLinkText")}
                                        </Link>
                                        .
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col w-full lg:w-[calc(33%-25px)] xl:w-[calc(50%-30px)] gap-10">
                            <h5>{t("openingHoursHeading")}</h5>
                            <div className="flex justify-between items-center flex-col text-sm">
                                {WEEKDAYS.map((day) => (
                                    <div key={day} className="w-full flex justify-between items-center gap-4">
                                        <p>{t(`days.${day}`)}</p>
                                        <p>{store.opening_hours[day] || t("closed")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(contact.phone || contact.email) && (
                            <div className="flex flex-col w-full lg:w-[calc(33%-25px)] xl:w-[calc(50%-30px)] gap-10">
                                <h5>{t("contactHeading")}</h5>
                                <div className="flex justify-between items-start flex-col text-sm">
                                    {contact.phone && <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>}
                                    {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Gallery />
            </div>
            {address && <Map store_name={store.store_name} address={address} />}
        </div>
    );
}
