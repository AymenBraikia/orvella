"use client";

import { capture_order } from "@/app/paypal/capture_order";
import { cancel_paypal_order, create_order } from "@/app/paypal/create_order";
import { Supported_Currencies } from "@/currency";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { DISPATCH_ACTION } from "@paypal/react-paypal-js";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayPal_Btn({ disabled, currency }: { disabled: boolean; currency: Supported_Currencies }) {
    return (
        <PayPalScriptProvider
            options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency,
            }}
        >
            <PayPal_Btn_Inner disabled={disabled} currency={currency} />
        </PayPalScriptProvider>
    );
}

function PayPal_Btn_Inner({ disabled, currency }: { disabled: boolean; currency: Supported_Currencies }) {
    const router = useRouter();
    const t = useTranslations("checkout.errors");
    const [error, set_error] = useState<string | null>(null);

    const [{ options }, dispatch] = usePayPalScriptReducer();

    useEffect(() => {
        if (options.currency === currency) return;

        dispatch({
            type: DISPATCH_ACTION.RESET_OPTIONS,
            value: {
                ...options,
                currency,
            },
        });
    }, [currency, options, dispatch]);

    return (
        <>
            <PayPalButtons
                disabled={disabled}
                fundingSource="paypal"
                forceReRender={[currency]}
                style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "sharp",
                    label: "checkout",
                    height: 45,
                    disableMaxWidth: true,
                }}
                createOrder={async () => {
                    set_error(null);
                    const result = await create_order();

                    if ("error" in result) {
                        set_error(t(result.error, { items: result.items?.join(", ") ?? "" }));
                        router.refresh();
                        throw new Error(result.error);
                    }

                    return result.id;
                }}
                onCancel={async (data) => {
                    if (typeof data.orderID == "string") await cancel_paypal_order(data.orderID);
                    router.refresh();
                }}
                onError={(err) => console.error("PayPal error:", err)}
                onApprove={async (data: { orderID: string }) => {
                    const result = await capture_order(data);

                    if ("redirect" in result) return router.push(result.redirect);

                    set_error(t(result.error, { items: "" }));
                    router.refresh();
                }}
            />
            {error && (
                <p role="alert" className="text-red-400 text-sm mt-2">
                    {error}
                </p>
            )}
        </>
    );
}
