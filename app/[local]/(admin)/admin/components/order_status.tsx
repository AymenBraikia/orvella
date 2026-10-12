"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Order } from "@/types/order";
import { set_order_status } from "@/app/server/admin/order_actions";

const options: Order["status"][] = ["Pending", "Completed", "Failed"];

export default function OrderStatus({ id, status }: { id: string; status: Order["status"] }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    return (
        <select
            defaultValue={status}
            disabled={pending}
            onChange={(e) =>
                start(async () => {
                    await set_order_status(id, e.target.value as Order["status"]);
                    router.refresh();
                })
            }
            className={`bg-transparent outline-none text-sm border-b border-(--foreground)/30 py-0.5 ${pending ? "opacity-40" : ""}`}
        >
            {options.map((option) => (
                <option key={option} value={option} className="bg-background">
                    {option}
                </option>
            ))}
        </select>
    );
}
