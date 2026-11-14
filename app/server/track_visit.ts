"use server";
import { cookies } from "next/headers";
import { collected_data_collection } from "../db/collections";

export async function track_visit(
    name: string,
    device: {
        type: "Desktop" | "Laptop" | "Tablet" | "Mobile";
        width: number;
        height: number;
        os: string;
    },
    local_date: Date,
) {
    const cookiesStore = await cookies();
    const session_id = cookiesStore.get("analytics_session_id")?.value;

    if (session_id) return;

    const new_session_id = crypto.randomUUID();

    cookiesStore.set("analytics_session_id", new_session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    const ip = process.env.NODE_ENV == "production" ? cookiesStore.get("ip")?.value || "" : (await (await fetch("https://api.ipify.org?format=json")).json()).ip;
    console.clear();

    const network = await get_ip_info(ip);
    console.log(ip, network);

    if (name && network) {
        const operation = await (
            await collected_data_collection()
        ).updateOne(
            { name },
            {
                $push: {
                    visits: {
                        device,
                        network,
                        local_date,
                        session_id: new_session_id,
                        visited_paths: [],
                    },
                },
                $set: { visited: true },
            },
        );
        console.log("SHOULD UPDATE: ", operation.modifiedCount);
    }
}

async function get_ip_info(ip: string): Promise<{ ip: string; isp: string; country: string } | undefined> {
    const response = await fetch(`http://ip-api.com/json/${ip}`);

    if (!response.ok) return;

    const data = await response.json();

    if (data.status === "fail") return;

    return {
        ip: data.query,
        isp: data.isp || data.org || "Unknown",
        country: data.country || "Unknown",
    };
}
