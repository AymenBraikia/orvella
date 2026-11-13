import { NextRequest } from "next/server";
import { collected_data_collection } from "../db/collections";

export async function track_visit(request: NextRequest) {
    // if (sessionStorage.getItem("analytics_session_id")) return console.log("MOTHER FUCKER KID BITCH: ", sessionStorage.getItem("analytics_session_id"));

    const session_id = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", session_id);

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";

    const network = await get_ip_info(ip);

    const date = new Date();

    const name = request.nextUrl.pathname.split("/")[2];

    console.log(name, network);

    if (name && network) (await collected_data_collection()).updateOne({ name }, { $push: { visits: { local_date: date, device: undefined, network, session_id, visited_paths: [] } }, $set: { visited: true } });
}

async function get_ip_info(ip: string): Promise<{ ip: string; isp: string; country: string } | undefined> {
    const target = ip ? ip : "";
    const response = await fetch(`http://ip-api.com/json/${target}`);

    if (!response.ok) return;

    const data = await response.json();

    if (data.status === "fail") return;

    return {
        ip: data.query,
        isp: data.isp || data.org || "Unknown",
        country: data.country || "Unknown",
    };
}

// function get_device_info() {
//     const width = window.innerWidth;
//     const height = window.innerHeight;
//     const ua = navigator.userAgent;

//     let os = "Unknown";
//     if (/windows nt/i.test(ua)) os = "Windows";
//     else if (/mac os x/i.test(ua)) os = "macOS";
//     else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "Linux";
//     else if (/android/i.test(ua)) os = "Android";
//     else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

//     let type: "Desktop" | "Laptop" | "Tablet" | "Mobile" = "Desktop";
//     const isTouch = navigator.maxTouchPoints > 0;

//     if (/mobi|android|iphone/i.test(ua) && width < 768) type = "Mobile";
//     else if (/ipad|tablet/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) type = "Tablet";
//     else if (isTouch || width <= 1366) type = "Laptop";
//     else type = "Desktop";

//     return {
//         type,
//         width,
//         height,
//         os,
//     };
// }
