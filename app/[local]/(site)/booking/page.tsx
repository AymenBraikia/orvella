import Form from "./form";
import { getTranslations } from "next-intl/server";


export default async function BookingPage() {
    const t = await getTranslations("booking");

    return (
        <div className="w-full max-w-5xl flex-center flex-col gap-6 py-8 sm:px-20 px-6">
            <h1 className="font-semibold font-secondary">{t("heading")}</h1>

            <p className="tracking-widest leading-6 text-shine">{t("intro")}</p>

            <Form />
        </div>
    );
}