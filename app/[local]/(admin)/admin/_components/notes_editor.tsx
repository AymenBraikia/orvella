"use client";

import { useState, useTransition } from "react";

/** Internal notes field with an explicit save (never shown to customers). */
export default function NotesEditor({ initial, save }: { initial: string; save: (notes: string) => Promise<boolean> }) {
    const [value, set_value] = useState(initial);
    const [saved, set_saved] = useState(initial);
    const [state, set_state] = useState<"idle" | "saved" | "error">("idle");
    const [pending, start] = useTransition();

    return (
        <div className="flex flex-col gap-2">
            <textarea value={value} onChange={(e) => {
                    set_value(e.target.value);
                    set_state("idle");
                }} rows={5} placeholder="Only visible to the store." className="border border-secondary/40 bg-transparent p-2 text-sm outline-none focus:border-gold" />
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={pending || value == saved}
                    onClick={() =>
                        start(async () => {
                            const ok = await save(value);
                            set_state(ok ? "saved" : "error");
                            if (ok) set_saved(value);
                        })
                    }
                    className={`button px-4! py-2! text-sm ${pending || value == saved ? "disabled" : ""}`}
                >
                    {pending ? "Saving…" : "Save notes"}
                </button>
                {state == "saved" && <span className="text-xs text-emerald-500">Saved</span>}
                {state == "error" && <span className="text-xs text-red-400">Could not save</span>}
            </div>
        </div>
    );
}
