import "server-only";

import type { Filter } from "mongodb";
import { orders_collection } from "@/app/db/collections";
import { normalize_order } from "@/app/server/orders";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import type { Order } from "@/types/order";
import { PAGE_SIZE } from "../_components/ui";

const LEGACY: Record<string, string[]> = { pending_payment: ["Pending"], paid: ["Completed"], cancelled: ["Failed"] };

export async function list_orders(params: { q?: string; status?: string; method?: string; email?: string; page: number }) {
    const filter: Filter<Order> = {};

    if (params.status) filter.status = { $in: [params.status, ...(LEGACY[params.status] ?? [])] } as Filter<Order>["status"];
    if (params.method) filter.payment_method = params.method as Order["payment_method"];
    if (params.email) filter.email = params.email;
    if (params.q?.trim()) {
        const rx = { $regex: escape_regex(params.q.trim()), $options: "i" };
        filter.$or = [{ id: rx }, { email: rx }, { first_name: rx }, { last_name: rx }, { paypal_order_id: rx }] as Filter<Order>[];
    }

    const orders = await orders_collection();
    const total = await orders.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(params.page, pages);

    const docs = await orders
        .find(filter, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray();

    return { rows: JSON.parse(JSON.stringify(docs.map(normalize_order))) as Order[], total, pages, page };
}

export async function get_order(id: string): Promise<Order | null> {
    const doc = await (await orders_collection()).findOne({ id }, { projection: { _id: 0 } });
    return doc ? JSON.parse(JSON.stringify(normalize_order(doc))) : null;
}
