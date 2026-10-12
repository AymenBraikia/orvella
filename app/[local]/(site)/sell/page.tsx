import Link from "next/link";
import Banner from "@/app/components/banner";
import Form from "./form";
import { getTranslations } from "next-intl/server";

export default async function SellPage() {
    const t = await getTranslations("sell");

    const steps = t.raw("consign.steps") as {
        title: string;
        text: string;
    }[];
    const sell_steps = t.raw("sellDirect.steps") as {
        title: string;
        text: string;
    }[];

    return (
        <section className="w-full flex flex-col items-center justify-start gap-12 py-20 px-4 sm:px-20">
            <div className="w-full max-w-dvw flex flex-col gap-10">
                <Banner>
                    <h1 className="tracking-wider font-secondary font-medium">{t("heading")}</h1>
                </Banner>
            </div>

            <div className="w-full">
                <h2>{t("formCtaHeading")}</h2>
                <br />
                <p className="tracking-widest text-shine">{t("formCtaText")}</p>
                <br />
                <Link href={"#form"} className="underline">
                    {t("beginCta")}
                </Link>
            </div>

            <div className="w-full py-4 flex flex-col gap-8">
                <h3 className="font-medium">{t("howItWorksHeading")}</h3>
                <div className="flex justify-start items-start flex-col gap-4">
                    <h4 className="underline">{t("consign.heading")}</h4>
                    <p className="text-sm tracking-widest text-shine">{t("consign.intro")}</p>
                    <div className="w-full">
                        <ul className="list-decimal ms-4">
                            {steps.map((e) => (
                                <li key={e.title} className="text-xl my-2">
                                    {e.title}
                                    <p className="text-sm tracking-wider mt-2 ms-4 text-secondary">{e.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex justify-start items-start flex-col gap-4">
                    <h4 className="underline">{t("sellDirect.heading")}</h4>
                    <p className="text-sm tracking-widest text-shine">{t("sellDirect.intro")}</p>
                    <div className="w-full">
                        <ul className="list-decimal ms-4">
                            {sell_steps.map((e) => (
                                <li key={e.title} className="text-xl my-2">
                                    {e.title}
                                    <p className="text-sm tracking-wider mt-2 ms-4 text-secondary">{e.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <Form />
            </div>
        </section>
    );
}
