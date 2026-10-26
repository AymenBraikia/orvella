import "server-only";

import type { Document } from "mongodb";
import { consignments_collection, sell_collection } from "@/app/db/collections";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import type { LeadStatus } from "@/types/lead";
import type { Sell } from "@/types/sell";
import type { Consignment } from "@/types/consignment";
import { PAGE_SIZE } from "../_components/ui";

export type Lead = (Sell | Consignment) & { status: LeadStatus };

/** Leads from before statuses existed only have `handled`. */
function with_status(doc: Sell | Consignment): Lead {
    // Requests sent before uploads worked may hold junk instead of URLs.
    const images = Array.isArray(doc.images) ? doc.images.filter((i) => typeof i == "string") : [];
    return { ...doc, images, status: doc.status ?? (doc.handled ? "closed" : "new") };
}

export async function list_leads(params: { q?: string; status?: string; intent?: string; page: number }) {
    const match: Document = {};
    if (params.status == "new") match.$or = [{ status: "new" }, { status: { $exists: false }, handled: { $ne: true } }];
    else if (params.status) match.status = params.status;
    if (params.intent == "sell" || params.intent == "consign") match.intent = params.intent;
    if (params.q?.trim()) {
        const rx = { $regex: escape_regex(params.q.trim()), $options: "i" };
        match.$and = [{ $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }, { brand: rx }, { model: rx }, { refNum: rx }] }];
    }

    const pipeline: Document[] = [{ $unionWith: { coll: "consignment" } }, { $match: match }, { $project: { _id: 0 } }, { $sort: { created_at: -1 } }];

    const sell = await sell_collection();
    const [{ total = 0 } = {}] = await sell.aggregate<{ total: number }>([...pipeline, { $count: "total" }]).toArray();
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(params.page, pages);

    const rows = await sell.aggregate<Sell | Consignment>([...pipeline, { $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }]).toArray();

    return { rows: JSON.parse(JSON.stringify(rows.map(with_status))) as Lead[], total, pages, page };
}

/** The collection a lead lives in, found by its id. */
export async function find_lead(id: string): Promise<{ lead: Lead; source: "sell" | "consign" } | null> {
    const sell = await (await sell_collection()).findOne({ id }, { projection: { _id: 0 } });
    if (sell) return { lead: JSON.parse(JSON.stringify(with_status(sell))), source: "sell" };

    const consign = await (await consignments_collection()).findOne({ id }, { projection: { _id: 0 } });
    if (consign) return { lead: JSON.parse(JSON.stringify(with_status(consign))), source: "consign" };

    return null;
}

/** wa.me wants the number in international format, digits only. */
export function whatsapp_link(phone: string, text: string): string | null {
    let digits = phone.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    else if (digits.startsWith("00")) digits = digits.slice(2);
    digits = digits.replace(/\D/g, "");
    if (digits.length < 7) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
