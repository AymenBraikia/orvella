import { Visitor } from "@/types/visitor";
import { private_demos_collection, visitors_collection } from "../db/collections";
import { NextRequest } from "next/server";
import { sanitizeRef } from "@/i18n/brand";
import { createHmac } from "node:crypto";
import { track_visit } from "./track_visit";

/**
 * Repeat visits are recognised by a keyed hash of the IP address; the address itself is never stored
 * (GDPR). Keyed with the server secret, so the hash cannot be reversed by trying every address.
 */
function hash_ip(ip: string): string | undefined {
    const secret = process.env.JWT_SECRET;
    if (!ip || !secret) return undefined;
    return createHmac("sha256", secret).update(`visit:${ip}`).digest("hex").slice(0, 32);
}

export async function save_visit(request: NextRequest) {
    let ref = sanitizeRef(request.nextUrl.searchParams.get("ref"));
    let demo_name = request.nextUrl.pathname.split("/")[2];

    if (!ref && demo_name && (await (await private_demos_collection()).findOne({ slug: demo_name }))) ref = demo_name;
    else return console.log("NAW NOT FOUND LEAD: ", demo_name);

    console.log("bodies on bodies");

    const agent = request.headers.get("user-agent") ?? "";

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
    const ip_hash = hash_ip(ip);

    const collection = await visitors_collection();

    track_visit(request);
    if (ip_hash && (await collection.findOneAndUpdate({ ip_hash }, { $inc: { visits: 1 } }))) return;

    const visitor: Visitor = {
        userAgent: agent,

        referer: ref,

        ip_hash,

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
