import Dropdown from "@/app/components/dropdown";
import { getTranslations } from "next-intl/server";

type FaqItem = {
    q: string;
    a: string;
};

export default async function FaqPage() {
    const t = await getTranslations("faq");
    const paymentItems = t.raw("categories.payments.items") as FaqItem[];
    const watchItems = t.raw("categories.watches.items") as FaqItem[];
    const withdrawalItems = t.raw("categories.withdrawalWarranty.items") as FaqItem[];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 w-full">
                <h2 className="font-medium">{t("categories.payments.heading")}</h2>

                <Dropdown titles={paymentItems.map((item) => item.q)}>
                    <p>{paymentItems[0].a}</p>
                    <p>{paymentItems[1].a}</p>
                    <p>{paymentItems[2].a}</p>
                    <p>{paymentItems[3].a}</p>
                </Dropdown>

                <h2 className="font-medium">{t("categories.watches.heading")}</h2>

                <Dropdown titles={watchItems.map((item) => item.q)}>
                    <p>{watchItems[0].a}</p>
                    <p>{watchItems[1].a}</p>
                    <p>{watchItems[2].a}</p>
                    <p>{watchItems[3].a}</p>
                    <p>{watchItems[4].a}</p>
                    <p>{watchItems[5].a}</p>
                    <p>{watchItems[6].a}</p>
                    <p>{watchItems[7].a}</p>
                    <p>{watchItems[8].a}</p>
                    <p>{watchItems[9].a}</p>
                    <p>{watchItems[10].a}</p>
                    <p>{watchItems[11].a}</p>
                </Dropdown>

                <h2 className="font-medium">{t("categories.withdrawalWarranty.heading")}</h2>

                <Dropdown titles={withdrawalItems.map((item) => item.q)}>
                    <p>{withdrawalItems[0].a}</p>
                    <p>{withdrawalItems[1].a}</p>
                </Dropdown>
            </div>
        </div>
    );
}
