"use client";

import { useTranslations } from "next-intl";
import type { ItemStatus } from "@/types/item";

/** Corner label over a product image. Sold pieces stay listed as social proof. */
export default function StockBadge({ status }: { status?: ItemStatus }) {
    const t = useTranslations("common.stock");
    if (!status || status == "available") return null;

    return <span className="absolute top-3 inset-s-3 z-10 bg-background/85 text-gold text-xs uppercase tracking-[0.3em] px-3 py-1 font-sans pointer-events-none">{t(status)}</span>;
}
