"use client";

import { Watch } from "@/types/watch";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function InfoTable({ watch }: { watch: Watch }) {
    const [tab, set_tab] = useState<0 | 1 | 2 | 3>(0);

    const common = useTranslations("common");
    const payments = useTranslations("payments");
    const product = useTranslations("product");

    return (
        <div className="w-full flex-col flex mt-2 font-sans">
            <div className="w-full flex-center flex-wrap sm:flex-nowrap">
                <button
                    type="button"
                    className={`sm:w-full w-1/2 border-b text-xs sm:text-base px-2 py-4 sm:px-4 sm:py-4 ${tab == 0 ? "button brightness-100 border-b-foreground" : "button2 brightness-80 border-b-transparent"} transition-default`}
                    onClick={() => set_tab(0)}
                >
                    {common("productCard.details")}
                </button>

                <button
                    type="button"
                    className={`sm:w-full w-1/2 border-b text-xs sm:text-base px-2 py-4 sm:px-4 sm:py-4 ${tab == 1 ? "button brightness-100 border-b-foreground" : "button2 brightness-80 border-b-transparent"} transition-default`}
                    onClick={() => set_tab(1)}
                >
                    {payments("shippingHeading")}
                </button>

                <button
                    type="button"
                    className={`sm:w-full w-1/2 border-b text-xs sm:text-base px-2 py-4 sm:px-4 sm:py-4 ${tab == 2 ? "button brightness-100 border-b-foreground" : "button2 brightness-80 border-b-transparent"} transition-default`}
                    onClick={() => set_tab(2)}
                >
                    {payments("paymentsHeading")}
                </button>

                <button
                    type="button"
                    className={`sm:w-full w-1/2 border-b text-xs sm:text-base px-2 py-4 sm:px-4 sm:py-4 ${tab == 3 ? "button brightness-100 border-b-foreground" : "button2 brightness-80 border-b-transparent"} transition-default`}
                    onClick={() => set_tab(3)}
                >
                    {common("buttons.consignment")}
                </button>
            </div>

            <Displayed_Data watch={watch} tab={tab} common={common} payments={payments} product={product} />
        </div>
    );
}

function Displayed_Data({
    watch,
    tab,
    common,
    payments,
    product,
}: {
    watch: Watch;
    tab: 0 | 1 | 2 | 3;
    common: ReturnType<typeof useTranslations>;
    payments: ReturnType<typeof useTranslations>;
    product: ReturnType<typeof useTranslations>;
}) {
    switch (tab) {
        case 0: {
            const included = [
                watch.boxPapers.papers ? common("filters.includesPapers") : "",
                watch.boxPapers.box ? common("filters.includesBox") : "",
                watch.boxPapers.firstInvoice ? common("filters.includesFirstInvoice") : "",
                watch.boxPapers.serviceInvoice ? common("filters.includesServiceInvoice") : "",
            ]
                .filter(Boolean)
                .join(", ");

            return (
                <div className="w-full flex flex-col gap-2 py-4">
                    <Row label={common("filters.brand")} value={watch.brand} />

                    <Row label={product("model")} value={watch.model} />

                    <Row label={product("reference")} value={watch.reference} />

                    <Row label={common("filters.year")} value={String(watch.year)} />

                    <Row label={common("productCard.caseSize")} value={`${watch.caseDiameterMm} mm`} />

                    <Row label={common("productCard.movement")} value={watch.movement} />

                    <Row label={common("productCard.bracelet")} value={watch.braceletMaterial} />

                    <Row label={common("productCard.material")} value={watch.caseMaterial} />

                    <Row label={product("dial")} value={watch.dialColor} />

                    <Row label={common("productCard.condition")} value={watch.condition} />

                    <Row label={common("filters.waterResistance")} value={`${watch.waterResistanceM} m`} />

                    <Row label={product("scopeOfDelivery")} value={included ? `${included}.` : ""} />
                </div>
            );
        }

        case 1:
            return (
                <div className="w-full py-4">
                    {product("shippingText")} <br /> <br />
                    <Link href="/info/payments" className="underline">
                        {product("learnMoreShipping")} {product("here")}
                    </Link>
                    .
                </div>
            );

        case 2: {
            const headers = payments.raw("paymentsTable.headers") as string[];

            const rows = payments.raw("paymentsTable.rows") as string[][];

            return (
                <div className="w-full py-4 overflow-x-auto">
                    <table className="min-w-full text-start border-collapse">
                        <thead>
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="border-b border-secondary p-3 text-sm font-semibold">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.join("-")}>
                                    {row.map((cell, i) => (
                                        <td key={`${row[0]}-${i}`} className="border-b border-secondary p-3 text-sm">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        case 3:
            return (
                <div className="w-full py-4">
                    {product("consignmentBeforeLink")}{" "}
                    <Link href="/sell" className="underline">
                        {common("buttons.sellYourWatch")}
                    </Link>{" "}
                    {product("consignmentAfterLink")}
                </div>
            );

        default:
            return null;
    }
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-b-secondary flex justify-between md:justify-start items-center py-2">
            <p className="w-fit md:w-100">{label}</p>
            <p className="lowercase">{value}</p>
        </div>
    );
}
