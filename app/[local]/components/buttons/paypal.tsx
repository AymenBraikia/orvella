"use client";

import { capture_order } from "@/app/paypal/capture_order";
import { create_order } from "@/app/paypal/create_order";
import { Supported_Currencies } from "@/currency";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { DISPATCH_ACTION } from "@paypal/react-paypal-js";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    const { resolvedTheme } = useTheme();

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
    }, [currency, options.currency, dispatch]);

    return (
        <PayPalButtons
            disabled={disabled}
            fundingSource="paypal"
            forceReRender={[resolvedTheme, currency]}
            style={{
                layout: "vertical",
                color: resolvedTheme === "dark" ? "black" : "white",
                shape: "sharp",
                label: "checkout",
                height: 45,
                disableMaxWidth: true,
            }}
            createOrder={create_order}
            onError={handle_error}
            onApprove={async (data: { orderID: string }) => {
                const result = await capture_order(data);

                if (result?.redirect) {
                    router.push(result.redirect);
                }
            }}
        />
    );
}

function handle_error(error: Record<string, unknown>) {
    console.error("PayPal error:", error);
}
