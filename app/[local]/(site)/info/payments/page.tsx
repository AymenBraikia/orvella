import { getTranslations } from "next-intl/server";

type ShippingRow = [string, string, string];

export default async function ShippingAndPaymentsPage() {
    const t = await getTranslations("payments");

    const paymentHeaders = t.raw("paymentsTable.headers") as string[];
    const paymentRows = t.raw("paymentsTable.rows") as string[][];

    const regions = [
        {
            key: "germany",
            data: t.raw("germany") as {
                heading: string;
                text: string;
                rows: ShippingRow[];
            },
        },
        {
            key: "eu",
            data: t.raw("eu") as {
                heading: string;
                text: string;
                rows: ShippingRow[];
            },
        },
        {
            key: "worldwide",
            data: t.raw("worldwide") as {
                heading: string;
                text: string;
                rows: ShippingRow[];
            },
        },
    ];

    return (
        <div className="flex justify-center items-start flex-col w-full gap-10 py-20">
            <h1>{t("heading")}</h1>

            <div className="flex justify-center items-start flex-col gap-6 text-[14px] w-full">
                <h3>{t("paymentsHeading")}</h3>
                <p>{t("paymentsSubtext")}</p>

                <table className="w-full bg-background">
                    <thead>
                        <tr>
                            {paymentHeaders.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paymentRows.map((row) => (
                            <tr key={row.join("-")}>
                                {row.map((cell, index) => (
                                    <td key={`${row[0]}-${index}`}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h3>{t("shippingHeading")}</h3>

                {regions.map(({ key, data }) => (
                    <section key={key} className="w-full">
                        <h5>{data.heading}</h5>
                        <p>{data.text}</p>

                        <table className="w-full bg-background">
                            <thead>
                                <tr>
                                    <th>{data.heading}</th>
                                    <th>{t("value")}</th>
                                    <th>{t("cost")}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.rows.map((row) => (
                                    <tr key={row.join("-")}>
                                        <td>{row[0]}</td>
                                        <td>{row[1]}</td>
                                        <td>{row[2]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                ))}
            </div>
        </div>
    );
}
