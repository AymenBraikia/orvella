"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";

/** Dropdown that saves immediately (lead / appointment status). */
export default function StatusSelect({ value, options, save }: { value: string; options: { value: string; label: string }[]; save: (value: string) => Promise<boolean> }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    return (
        <select
            aria-label="Status"
            disabled={pending}
            value={value}
            onChange={(e) =>
                start(async () => {
                    await save(e.target.value);
                    router.refresh();
                })
            }
            className="border border-secondary/40 bg-background px-2 py-1 text-sm outline-none focus:border-gold"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
