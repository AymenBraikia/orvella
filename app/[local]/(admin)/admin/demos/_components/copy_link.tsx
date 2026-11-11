"use client";

import { useState } from "react";

/** The demo's public link, with a button to copy it for a DM. */
export default function CopyLink({ url }: { url: string }) {
    const [copied, set_copied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            set_copied(true);
            setTimeout(() => set_copied(false), 2000);
        } catch {
            window.prompt("Copy the link:", url);
        }
    }

    return (
        <div className="flex items-center gap-2 min-w-0">
            <a href={url} target="_blank" rel="noreferrer" className="underline truncate">
                {url.replace(/^https?:\/\//, "")}
            </a>
            <button type="button" onClick={copy} className="button2 px-2! py-0.5! text-xs shrink-0">
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}
