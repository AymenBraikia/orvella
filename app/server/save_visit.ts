import { Visitor } from "@/types/visitor";
import { visitors_collection } from "../db/collections";
import { NextRequest } from "next/server";
import { sanitizeRef } from "@/i18n/brand";

export async function save_visit(request: NextRequest) {
    const collection = await visitors_collection();

    const agent = request.headers.get("user-agent") ?? "";

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    const ipv4 =
        forwardedFor
            ?.split(",")
            .map((ip) => ip.trim())
            .find((ip) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) ?? (realIp && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(realIp) ? realIp : undefined);

    if (await collection.findOneAndUpdate({ ip: ipv4 }, { $inc: { visits: 1 } })) return;

    const visitor: Visitor = {
        userAgent: agent,

        referer: sanitizeRef(request.nextUrl.searchParams.get("ref"))!,

        ip: ipv4,

        id: Math.floor(Math.random() * 1e6).toString(),

        timestamp: new Date(),

        device: getDevice(agent),
        browser: getBrowser(agent),
        os: getOS(agent),
        visits: 1,
        set: false,
        saw_pop_up: false,
        clicked: false,
        closed: false,
        ignored: true,
    };
    collection.insertOne(visitor);
}

function getDevice(userAgent: string): Visitor["device"] {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return "tablet";
    }

    if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) {
        return "mobile";
    }

    if (userAgent) {
        return "desktop";
    }

    return "unknown";
}

function getBrowser(userAgent: string): string {
    if (/edg/i.test(userAgent)) return "Edge";
    if (/opr|opera/i.test(userAgent)) return "Opera";
    if (/chrome|crios/i.test(userAgent)) return "Chrome";
    if (/firefox|fxios/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
        return "Safari";
    }
    if (/msie|trident/i.test(userAgent)) return "Internet Explorer";

    return "Unknown";
}

function getOS(userAgent: string): string {
    if (/windows nt/i.test(userAgent)) return "Windows";
    if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
    if (/android/i.test(userAgent)) return "Android";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
    if (/linux/i.test(userAgent)) return "Linux";

    return "Unknown";
}
