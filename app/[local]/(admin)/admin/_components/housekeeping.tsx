"use client";

import { useEffect } from "react";
import { admin_housekeeping } from "../actions/housekeeping";

const KEY = "admin-housekeeping-at";
const EVERY_MS = 5 * 60_000;

/** While the dealer uses the admin, lapsed reservations are released every few minutes (in addition to the daily cron). */
export default function Housekeeping() {
    useEffect(() => {
        try {
            const last = Number(sessionStorage.getItem(KEY) || 0);
            if (Date.now() - last < EVERY_MS) return;
            sessionStorage.setItem(KEY, String(Date.now()));
        } catch {
            // storage unavailable: just run it
        }
        admin_housekeeping().catch(() => {});
    }, []);

    return null;
}
