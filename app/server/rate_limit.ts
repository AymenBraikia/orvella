import "server-only";

import { headers } from "next/headers";
import { db } from "../db/collections";

/*
 * Simple fixed-window rate limiter stored in MongoDB (no extra service):
 * one document per key and window, incremented atomically, removed by a TTL index on expires_at
 * (see scripts/ensure-indexes.ts).
 */

type Bucket = { _id: string; count: number; expires_at: Date };

export const LIMITS = {
    login: { limit: 10, window_seconds: 15 * 60 },
    sign_up: { limit: 5, window_seconds: 60 * 60 },
    password_reset: { limit: 5, window_seconds: 60 * 60 },
    sell: { limit: 5, window_seconds: 60 * 60 },
    booking: { limit: 5, window_seconds: 60 * 60 },
    enquiry: { limit: 10, window_seconds: 60 * 60 },
    upload: { limit: 60, window_seconds: 60 * 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

/** The visitor's IP as seen by Vercel (first x-forwarded-for entry), or "unknown". */
export async function client_ip(): Promise<string> {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** true if this request is still within the limit for `name` (counts the request). Fails open if the DB is unreachable. */
export async function within_limit(name: LimitName, key?: string): Promise<boolean> {
    const { limit, window_seconds } = LIMITS[name];
    const window = Math.floor(Date.now() / 1000 / window_seconds);
    const id = `${name}:${key ?? (await client_ip())}:${window}`;

    try {
        const bucket = await (await db())
            .collection<Bucket>("rate_limits")
            .findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expires_at: new Date((window + 1) * window_seconds * 1000) } }, { upsert: true, returnDocument: "after" });
        return (bucket?.count ?? 0) <= limit;
    } catch (error) {
        console.error("rate limit check failed", error);
        return true;
    }
}

/** Hidden form field that people never see or fill; bots usually do. */
export const HONEYPOT_FIELD = "website";

export function is_bot(input: unknown): boolean {
    const value = (input as Record<string, unknown> | null)?.[HONEYPOT_FIELD];
    return typeof value == "string" && value.trim() !== "";
}
