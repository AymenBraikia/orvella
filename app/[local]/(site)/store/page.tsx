import Link from "next/link";
import Map from "./map";
import Gallery from "./gallery";
import { useTranslations } from "next-intl";
type Props = {
    params: Promise<{ ref: string }>;
};

export default async function StorePage({ params }: Props) {
    const { ref } = await params;
    const t = useTranslations("store");
    return (
        <div className="flex justify-start items-start flex-wrap w-full gap-10 py-20 px-5 md:px-10 xl:px-20">
            <h1>{t("heading")}</h1>

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
                                <p>Marie-Curie-Straße 14 60439 Frankfurt am Main Germany</p>
                                <p>
                                    {t("parkingText")}{" "}
                                    <Link
                                        className="underline"
                                        href={
                                            "https://www.google.com/maps/place/PARK+ONE+Tiefgarage+Colosseo/@50.1053258,8.6941458,17z/data=!3m1!4b1!4m6!3m5!1s0x47bd0e9fcc2aec01:0xc150aeb0011da62c!8m2!3d50.1053224!4d8.6963345!16s%2Fg%2F11c2mdbn86"
                                        }
                                    >
                                        {t("parkingLinkText")}
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col w-full lg:w-[calc(33%-25px)] xl:w-[calc(50%-30px)] gap-10">
                            <h5>{t("openingHoursHeading")}</h5>
                            <div className="flex justify-between items-center flex-col text-sm">
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.monday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.tuesday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.wednesday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.thursday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.friday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.saturday")}</p>
                                    <p>11:00 – 17:00</p>
                                </div>
                                <div className="w-full flex justify-between items-center gap-4">
                                    <p>{t("days.sunday")}</p>
                                    <p>{t("closed")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col w-full lg:w-[calc(33%-25px)] xl:w-[calc(50%-30px)] gap-10">
                            <h5>{t("contactHeading")}</h5>
                            <div className="flex justify-between items-start flex-col text-sm">
                                <p>+213 559 07 8448</p>
                                <p>+213 559 07 8448</p>
                                <p>info@{ref || "arvell"}.com</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Gallery />
            </div>
            <Map />
        </div>
    );
}
