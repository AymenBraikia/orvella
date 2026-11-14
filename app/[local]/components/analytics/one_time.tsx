"use client";

import { track_visit } from "@/app/server/track_visit";
import { useEffect, useState } from "react";

export default function AnalyticsOneTime() {
    const [name, set_name] = useState<string | null>(null);
    const [device, set_device] = useState<{
        type: "Desktop" | "Laptop" | "Tablet" | "Mobile";
        width: number;
        height: number;
        os: string;
    } | null>(null);
    const [local_date, set_local_date] = useState<Date | null>(null);

    useEffect(() => {
        if (!name && location.pathname.split("/")[2]) set_name(location.pathname.split("/")[2]);
        if (!device && get_device_info()) set_device(get_device_info());
        if (!local_date) set_local_date(new Date());

        if (local_date && name && device) track_visit(name, device, local_date);
    }, [local_date, name, device]);

    return null;
}

function get_device_info() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent;

    let os = "Unknown";
    if (/windows nt/i.test(ua)) os = "Windows";
    else if (/mac os x/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

    let type: "Desktop" | "Laptop" | "Tablet" | "Mobile" = "Desktop";
    const isTouch = navigator.maxTouchPoints > 0;

    if (/mobi|android|iphone/i.test(ua) && width < 768) type = "Mobile";
    else if (/ipad|tablet/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) type = "Tablet";
    else if (isTouch || width <= 1366) type = "Laptop";
    else type = "Desktop";

    return { type, width, height, os };
}
