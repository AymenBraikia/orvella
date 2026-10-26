import "server-only";

import type { Filter } from "mongodb";
import { items_collection } from "@/app/db/collections";
import { available_quantity, stock_status } from "@/app/(site)/lib/stock";
import { escape_regex } from "@/app/(site)/lib/escape_regex";
import { item_name } from "@/app/(site)/lib/item_name";
import type { Item, ItemStatus } from "@/types/item";
import { PAGE_SIZE } from "../_components/ui";

export type ProductRow = {
    slug: string;
    type: Item["type"];
    name: string;
    reference?: string;
    image?: string;
    price: number;
    status: ItemStatus;
    available: number;
    featured: boolean;
    deleted: boolean;
    date_added: string;
};

export async function list_products(params: { q?: string; type?: string; status?: string; featured?: string; show?: string; page: number }) {
    const filter: Filter<Item> = params.show == "deleted" ? { deleted: true } : { deleted: { $ne: true } };

    if (params.type) filter.type = params.type as Item["type"];
    if (params.featured == "yes") filter.featured = true;
    if (params.q?.trim()) {
        const rx = { $regex: escape_regex(params.q.trim()), $options: "i" };
        filter.$or = [{ display_name: rx }, { brand: rx }, { model: rx }, { reference: rx }, { slug: rx }] as Filter<Item>[];
    }

    const docs = await (
        await items_collection()
    )
        .find(filter, { projection: { _id: 0, slug: 1, type: 1, display_name: 1, brand: 1, model: 1, reference: 1, price: 1, images: { $slice: 1 }, featured: 1, date_added: 1, quantity: 1, inStock: 1, reservations: 1, deleted: 1 } })
        .sort({ date_added: -1 })
        .toArray();

    const now = Date.now();
    let rows: ProductRow[] = docs.map((d) => ({
        slug: d.slug,
        type: d.type,
        name: item_name(d),
        reference: "reference" in d ? d.reference : undefined,
        image: d.images?.[0],
        price: d.price,
        status: stock_status(d, now),
        available: available_quantity(d, now),
        featured: Boolean(d.featured),
        deleted: Boolean(d.deleted),
        date_added: new Date(d.date_added).toISOString(),
    }));

    // Stock state is resolved at read time (a lapsed hold is already "available"), so filter here.
    if (params.status) rows = rows.filter((r) => r.status == params.status);

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(params.page, pages);

    return { rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, pages, page };
}
