"use server";
import { cookies } from "next/headers";
import { collected_data_collection } from "../db/collections";

const BOT_ISP = /facebook|meta platforms|amazon|aws/i;
const cookie_base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function track_visit(name: string, device: { type: "Desktop" | "Laptop" | "Tablet" | "Mobile"; width: number; height: number; os: string }, local_date: Date) {
    const cookieStore = await cookies();
    if (cookieStore.get("analytics_session_id")?.value || cookieStore.get("bot")?.value === "1") return;

    const ip = process.env.NODE_ENV == "production" ? cookieStore.get("ip")?.value || "" : (await (await fetch("https://api.ipify.org?format=json")).json()).ip;
    const network = await get_ip_info(ip);
    if (!name || !network) return;

    if (network.hosting || BOT_ISP.test(network.isp)) {
        cookieStore.set("bot", "1", cookie_base);
        return;
    }

    const new_session_id = crypto.randomUUID();
    cookieStore.set("analytics_session_id", new_session_id, cookie_base);

    await (
        await collected_data_collection()
    ).updateOne(
        { name },
        {
            $push: { visits: { device, network: { ip: network.ip, isp: network.isp, country: network.country }, local_date, session_id: new_session_id, visited_paths: [] } },
            $set: { visited: true },
        },
    );
}

async function get_ip_info(ip: string) {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,query,isp,org,country,countryCode,hosting`);
    if (!response.ok) return;
    const data = await response.json();
    if (data.status === "fail") return;
    return {
        ip: data.query as string,
        isp: (data.isp || data.org || "Unknown") as string,
        country: (data.country || "Unknown") as string,
        country_code: data.countryCode as string,
        hosting: !!data.hosting,
    };
}
