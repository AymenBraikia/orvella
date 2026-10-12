import { unstable_cache } from "next/cache";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

const get_token = unstable_cache(
    async () => {
        const auth = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");

        const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        if (!res.ok) throw new Error(`PayPal token request failed with ${res.status}`);

        const data = await res.json();
        return data.access_token as string;
    },
    ["paypal:token"],
    { revalidate: 28800 },
);

export async function getAccessToken() {
    return get_token();
}
