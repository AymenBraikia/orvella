import "server-only";

import { appointments_collection, consignments_collection, items_collection, orders_collection, sell_collection } from "@/app/db/collections";
import { stock_status } from "@/app/(site)/lib/stock";
import type { ItemStatus } from "@/types/item";
import type { Order } from "@/types/order";
import type { Sell } from "@/types/sell";
import type { Consignment } from "@/types/consignment";
import type { Filter } from "mongodb";

/** Leads written before statuses existed only have `handled`. */
export const NEW_LEAD_FILTER: Filter<Sell | Consignment> = { $or: [{ status: "new" }, { status: { $exists: false }, handled: { $ne: true } }] };

export function start_of_today(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export async function overview_stats() {
    const month_start = new Date();
    month_start.setUTCDate(1);
    month_start.setUTCHours(0, 0, 0, 0);

    const [items, orders, sell, consign, appointments] = await Promise.all([items_collection(), orders_collection(), sell_collection(), consignments_collection(), appointments_collection()]);

    const [stock_docs, pending_payment, to_ship, new_sell, new_consign, upcoming, month_orders, recent_orders] = await Promise.all([
        items.find({ deleted: { $ne: true } }, { projection: { _id: 0, quantity: 1, inStock: 1, reservations: 1 } }).toArray(),
        orders.countDocuments({ status: "pending_payment" }),
        orders.countDocuments({ status: "paid" }),
        sell.countDocuments(NEW_LEAD_FILTER as Filter<Sell>),
        consign.countDocuments(NEW_LEAD_FILTER as Filter<Consignment>),
        appointments.countDocuments({ date: { $gte: start_of_today() }, status: { $nin: ["cancelled", "done"] } }),
        orders.find({ status: { $in: ["paid", "shipped", "delivered"] }, created_at: { $gte: month_start } }, { projection: { _id: 0, totals: 1, exchange_rate: 1 } }).toArray(),
        orders.find({}, { projection: { _id: 0 }, sort: { created_at: -1 }, limit: 6 }).toArray(),
    ]);

    // Stock is resolved the same way the storefront does (lapsed holds count as available).
    const now = Date.now();
    const stock: Record<ItemStatus, number> = { available: 0, reserved: 0, sold: 0 };
    for (const doc of stock_docs) stock[stock_status(doc, now)]++;

    // Orders can be in any currency; the month total is shown in EUR at each order's own rate.
    const revenue_eur = month_orders.reduce((sum, o) => sum + (o.totals?.total ?? 0) / (o.exchange_rate || 1), 0);

    return {
        stock,
        pending_payment,
        to_ship,
        new_leads: new_sell + new_consign,
        upcoming,
        revenue_eur,
        month_order_count: month_orders.length,
        recent_orders: JSON.parse(JSON.stringify(recent_orders)) as Order[],
    };
}
