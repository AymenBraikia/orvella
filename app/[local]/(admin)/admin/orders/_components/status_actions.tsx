"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { change_order_status } from "../../actions/orders";
import ConfirmButton from "../../_components/confirm_button";
import type { OrderStatus, PaymentMethod } from "@/types/order";

/** The next steps that make sense for an order in its current state. */
export default function StatusActions({ id, status, payment_method }: { id: string; status: OrderStatus; payment_method: PaymentMethod }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, set_error] = useState<string | null>(null);
    const [note, set_note] = useState("");
    const [carrier, set_carrier] = useState("");
    const [tracking, set_tracking] = useState("");

    const go = (next: OrderStatus, extra?: { carrier: string; number: string }) =>
        new Promise<void>((resolve) =>
            start(async () => {
                set_error(null);
                const result = await change_order_status(id, next, note, extra);
                if (!result.ok) set_error(result.error ?? "Something went wrong.");
                else set_note("");
                router.refresh();
                resolve();
            }),
        );

    const primary = "button3 bg-gold text-primary px-4! py-2! text-sm";

    return (
        <div className="flex flex-col gap-4">
            {status == "pending_payment" && (
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={pending} className={primary} onClick={() => go("paid")}>
                        {payment_method == "Bank Transfer" ? "Mark payment received" : "Mark as paid"}
                    </button>
                    <ConfirmButton label="Cancel order (release pieces)" danger action={() => go("cancelled")} />
                </div>
            )}

            {status == "paid" && (
                <div className="flex flex-col gap-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            Carrier
                            <input value={carrier} onChange={(e) => set_carrier(e.target.value)} placeholder="DHL Express" className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold" />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            Tracking number
                            <input value={tracking} onChange={(e) => set_tracking(e.target.value)} className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold" />
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={pending || !carrier.trim() || !tracking.trim()} className={`${primary} ${!carrier.trim() || !tracking.trim() ? "disabled" : ""}`} onClick={() => go("shipped", { carrier, number: tracking })}>
                            Mark shipped
                        </button>
                        <ConfirmButton label="Mark refunded" danger action={() => go("refunded")} />
                    </div>
                </div>
            )}

            {status == "shipped" && (
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={pending} className={primary} onClick={() => go("delivered")}>
                        Mark delivered
                    </button>
                    <ConfirmButton label="Mark refunded" danger action={() => go("refunded")} />
                </div>
            )}

            {status == "delivered" && <ConfirmButton label="Mark refunded" danger action={() => go("refunded")} />}

            {status == "cancelled" && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-secondary">Payment arrived after all? Marking it paid takes the pieces out of stock again; if one was sold meanwhile you will see a stock warning.</p>
                    <ConfirmButton label="Mark payment received" action={() => go("paid")} />
                </div>
            )}

            {status != "refunded" && (
                <label className="flex flex-col gap-1 text-xs text-secondary">
                    Note for the status history (optional)
                    <input value={note} onChange={(e) => set_note(e.target.value)} className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold" />
                </label>
            )}

            {(status == "paid" || status == "shipped" || status == "delivered") && <p className="text-xs text-secondary">Refunds are paid out in PayPal or by bank transfer; this only records the status. Put returned pieces back on sale from Products.</p>}

            {error && (
                <p role="alert" className="text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
