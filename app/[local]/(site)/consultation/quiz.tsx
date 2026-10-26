"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "../context/currencyContext";
import { format_price } from "../lib/price_format";

type Answers = { category?: string; gender?: string; budget?: string; condition?: string };

/** Budgets in EUR (the catalogue currency); labels are shown in the visitor's currency. */
const BUDGETS: Record<string, [number, number] | null> = {
    under5: [0, 5000],
    b5to10: [5000, 10000],
    b10to25: [10000, 25000],
    over25: [25000, 10_000_000],
    any: null,
};

/**
 * Four quick questions that end on the collection with matching filters applied
 * (same URL parameters as the shop filters, so the result can be refined there).
 */
export default function Quiz() {
    const t = useTranslations("consultation");
    const router = useRouter();
    const currency = useCurrency();
    const [step, set_step] = useState(0);
    const [answers, set_answers] = useState<Answers>({});

    const steps: { key: keyof Answers; options: { value: string; label: string }[] }[] = [
        {
            key: "category",
            options: [
                { value: "watches", label: t("q1.watch") },
                { value: "rings", label: t("q1.ring") },
                { value: "bracelets", label: t("q1.bracelet") },
                { value: "necklaces", label: t("q1.necklace") },
            ],
        },
        {
            key: "gender",
            options: [
                { value: "Women", label: t("q2.women") },
                { value: "Men", label: t("q2.men") },
                { value: "", label: t("q2.any") },
            ],
        },
        {
            key: "budget",
            options: [
                { value: "under5", label: t("q3.upTo", { amount: format_price(5000, currency) }) },
                { value: "b5to10", label: `${format_price(5000, currency)} – ${format_price(10000, currency)}` },
                { value: "b10to25", label: `${format_price(10000, currency)} – ${format_price(25000, currency)}` },
                { value: "over25", label: t("q3.over", { amount: format_price(25000, currency) }) },
                { value: "any", label: t("q3.any") },
            ],
        },
        {
            key: "condition",
            options: [
                { value: "New", label: t("q4.new") },
                { value: "Pre-Owned", label: t("q4.preowned") },
                { value: "", label: t("q4.any") },
            ],
        },
    ];

    function finish(final: Answers) {
        const params = new URLSearchParams();
        if (final.gender) params.set("gender", final.gender);
        if (final.condition) params.set("condition", final.condition);
        const range = BUDGETS[final.budget ?? "any"];
        if (range) params.set("price", `${range[0]}-${range[1]}`);

        const qs = params.toString();
        router.push(`/${final.category ?? "shop"}${qs ? `?${qs}` : ""}`);
    }

    function choose(value: string) {
        const next = { ...answers, [steps[step].key]: value };
        set_answers(next);
        if (step == steps.length - 1) finish(next);
        else set_step(step + 1);
    }

    const current = steps[step];

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">{t("step", { current: step + 1, total: steps.length })}</p>
            <h2 className="font-secondary">{t(`q${step + 1}.question`)}</h2>

            <div className="grid sm:grid-cols-2 gap-3">
                {current.options.map((o) => (
                    <button
                        key={o.value || "any"}
                        type="button"
                        onClick={() => choose(o.value)}
                        className={`border p-5 text-start font-secondary text-lg transition-default hover:border-gold hover:text-gold ${answers[current.key] === o.value ? "border-gold text-gold" : "border-secondary/40"}`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {step > 0 && (
                <button type="button" onClick={() => set_step(step - 1)} className="w-fit text-sm underline text-secondary">
                    {t("back")}
                </button>
            )}
        </div>
    );
}
