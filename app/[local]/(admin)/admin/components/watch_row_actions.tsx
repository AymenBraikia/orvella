"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { delete_watch, toggle_watch_flag } from "@/app/server/admin/watch_actions";

export default function WatchRowActions({ slug, inStock, featured }: { slug: string; inStock: boolean; featured: boolean }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [confirming, set_confirming] = useState(false);

    const toggle = (path_field: "inStock" | "featured", value: boolean) =>
        start(async () => {
            await toggle_watch_flag(slug, path_field, value);
            router.refresh();
        });

    const remove = () =>
        start(async () => {
            await delete_watch(slug);
            set_confirming(false);
            router.refresh();
        });

    return (
        <div className={`flex items-center gap-3 text-xs ${pending ? "opacity-40" : ""}`}>
            <button type="button" onClick={() => toggle("inStock", !inStock)} disabled={pending} className="hover:underline">
                {inStock ? "In stock" : "Sold"}
            </button>

            <button type="button" onClick={() => toggle("featured", !featured)} disabled={pending} className="hover:underline opacity-70">
                {featured ? "Featured" : "Not featured"}
            </button>

            {confirming ? (
                <span className="flex items-center gap-2">
                    <button type="button" onClick={remove} disabled={pending} className="text-red-500 hover:underline">
                        Confirm
                    </button>
                    <button type="button" onClick={() => set_confirming(false)} className="opacity-60 hover:underline">
                        No
                    </button>
                </span>
            ) : (
                <button type="button" onClick={() => set_confirming(true)} className="text-red-500/80 hover:text-red-500">
                    Delete
                </button>
            )}
        </div>
    );
}
