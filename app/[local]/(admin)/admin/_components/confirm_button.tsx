"use client";

import { useEffect, useState, useTransition } from "react";

/** First click arms the button, second click (within a few seconds) runs the action. */
export default function ConfirmButton({ label, confirm_label = "Click again to confirm", action, className = "", danger = false }: { label: string; confirm_label?: string; action: () => Promise<unknown>; className?: string; danger?: boolean }) {
    const [armed, set_armed] = useState(false);
    const [pending, start] = useTransition();

    useEffect(() => {
        if (!armed) return;
        const timer = setTimeout(() => set_armed(false), 4000);
        return () => clearTimeout(timer);
    }, [armed]);

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => {
                if (!armed) return set_armed(true);
                set_armed(false);
                start(async () => {
                    await action();
                });
            }}
            className={`button2 px-3! py-1! text-xs ${armed && danger ? "text-red-400!" : ""} ${pending ? "disabled" : ""} ${className}`}
        >
            {pending ? "Working…" : armed ? confirm_label : label}
        </button>
    );
}
