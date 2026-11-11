"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import ConfirmButton from "../../_components/confirm_button";
import { delete_product, duplicate_product, restore_product, set_product_status, toggle_featured } from "../../actions/products";
import type { ItemStatus } from "@/types/item";

export default function RowActions({ slug, status, featured, deleted }: { slug: string; status: ItemStatus; featured: boolean; deleted: boolean }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    const run = (fn: () => Promise<unknown>) =>
        start(async () => {
            await fn();
            router.refresh();
        });

    if (deleted) return <ConfirmButton label="Restore" action={async () => run(() => restore_product(slug))} />;

    return (
        <div className="flex flex-wrap items-center gap-1">
            <select
                aria-label="Stock status"
                disabled={pending}
                value={status}
                onChange={(e) => run(() => set_product_status(slug, e.target.value as ItemStatus))}
                className="border border-secondary/40 bg-background px-2 py-1 text-xs outline-none focus:border-gold"
            >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
            </select>
            <button type="button" disabled={pending} onClick={() => run(() => toggle_featured(slug))} className="button2 px-3! py-1! text-xs">
                {featured ? "★ Featured" : "☆ Feature"}
            </button>
            <button
                type="button"
                disabled={pending}
                onClick={() =>
                    start(async () => {
                        const result = await duplicate_product(slug);
                        if (result.ok) router.push(`/admin/products/${result.slug}`);
                    })
                }
                className="button2 px-3! py-1! text-xs"
            >
                Duplicate
            </button>
            <ConfirmButton label="Delete" danger action={async () => run(() => delete_product(slug))} />
        </div>
    );
}
