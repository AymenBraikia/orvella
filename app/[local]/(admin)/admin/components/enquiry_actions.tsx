"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { delete_enquiry, set_enquiry_handled } from "@/app/server/admin/order_actions";

export default function EnquiryActions({ kind, id, handled }: { kind: "sell" | "consignment" | "appointment"; id: string; handled: boolean }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    const run = (fn: () => Promise<unknown>) =>
        start(async () => {
            await fn();
            router.refresh();
        });

    return (
        <div className={`flex items-center gap-3 text-xs ${pending ? "opacity-40" : ""}`}>
            <button type="button" disabled={pending} onClick={() => run(() => set_enquiry_handled(kind, id, !handled))} className="hover:underline">
                {handled ? "Handled" : "Mark handled"}
            </button>
            <button type="button" disabled={pending} onClick={() => run(() => delete_enquiry(kind, id))} className="text-red-500/80 hover:text-red-500">
                Delete
            </button>
        </div>
    );
}
