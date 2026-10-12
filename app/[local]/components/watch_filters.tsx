"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Range from "@/app/components/elements/range";
import Arrow from "@/app/components/svg/arrow";
import { format_price } from "../(site)/lib/price_format";

import {
    active_chips,
    count_active,
    empty_selection,
    remove_chip,
    set_range,
    toggle_include,
    toggle_list_value,
    type ActiveChip,
    type Facets,
    type FacetCounts,
    type IncludesKey,
    type ListFacet,
    type RangeFacet,
    type Selection,
} from "../(site)/lib/filters";
import { read_cookie } from "../(site)/lib/read_cookie";
import { Supported_Currencies } from "@/currency";

const T_KEY: Record<string, string> = {
    brand: "brands",
    condition: "condition",
    movement: "movement",
    caseMaterial: "caseMaterial",
    braceletMaterial: "braceletMaterial",
    dialColor: "dialColor",
    price: "price",
    caseDiameterMm: "caseDiameterMm",
    year: "year",
    waterResistanceM: "waterResistance",
    includes: "includes",
    availability: "availability",
};

type Section = { kind: "list"; facet: ListFacet; searchable?: boolean } | { kind: "range"; facet: RangeFacet; unit?: string; money?: boolean } | { kind: "includes" } | { kind: "availability" };

const SECTIONS: Section[] = [
    { kind: "list", facet: "brand", searchable: true },
    { kind: "range", facet: "price", money: true },
    { kind: "list", facet: "condition" },
    { kind: "list", facet: "movement" },
    { kind: "list", facet: "caseMaterial" },
    { kind: "list", facet: "braceletMaterial" },
    { kind: "list", facet: "dialColor" },
    { kind: "range", facet: "caseDiameterMm", unit: "mm" },
    { kind: "range", facet: "year" },
    { kind: "range", facet: "waterResistanceM", unit: "m" },
    { kind: "includes" },
    { kind: "availability" },
];

const DEFAULT_OPEN = new Set(["brand", "price"]);
const COLLAPSED_OPTIONS = 8;

interface WatchFiltersProps {
    facets: Facets;
    counts: FacetCounts;
    selection: Selection;
    onChange: (selection: Selection) => void;
    resultCount: number;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function WatchFilters({ facets, counts, selection, onChange, resultCount, open, setOpen }: WatchFiltersProps) {
    const t = useTranslations("common.filters");
    const panel = useRef<HTMLDivElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const restoreFocus = useRef<HTMLElement | null>(null);

    const activeCount = count_active(selection);

    useEffect(() => {
        if (!open) return;

        restoreFocus.current = document.activeElement as HTMLElement | null;
        closeButton.current?.focus();

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
            restoreFocus.current?.focus();
        };
    }, [open, setOpen]);

    const sections = SECTIONS.filter((section) => {
        if (section.kind === "list") return Boolean(facets.lists[section.facet]?.length);
        if (section.kind === "range") return Boolean(facets.ranges[section.facet]);
        if (section.kind === "includes") return facets.includes.length > 0;
        return facets.hasStockSplit;
    });

    return (
        <>
            <div aria-hidden="true" onClick={() => setOpen(false)} className={`fixed inset-0 z-90 bg-black/50 transition-default lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />

            <aside
                ref={panel}
                role="dialog"
                aria-modal={open || undefined}
                aria-label={t("filtersLabel")}
                className={`bg-background fixed inset-y-0 inset-s-0 z-100 flex w-[88%] max-w-sm flex-col transition-transform duration-300 ease-out lg:sticky lg:top-4 lg:z-0 lg:h-fit lg:max-h-[calc(100dvh-2rem)] lg:w-80 lg:max-w-none lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary/30 px-4 py-4">
                    <h2 className="title6 font-secondary font-semibold">
                        {t("filtersLabel")}
                        {activeCount > 0 && <span className="ms-2 text-sm font-normal text-secondary tabular-nums">({activeCount})</span>}
                    </h2>

                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <button type="button" onClick={() => onChange(empty_selection())} className="cursor-pointer text-sm text-secondary underline underline-offset-4 transition-default hover:text-foreground">
                                {t("clearAll")}
                            </button>
                        )}
                        <button ref={closeButton} type="button" onClick={() => setOpen(false)} className="cursor-pointer p-1 lg:hidden" aria-label={t("close")}>
                            <Arrow classnames="w-6 rotate-90" />
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                    {sections.map((section) => {
                        const key = section.kind === "list" || section.kind === "range" ? section.facet : section.kind;

                        return (
                            <Accordion key={key} title={t(T_KEY[key])} badge={section_badge(section, selection)} defaultOpen={DEFAULT_OPEN.has(key)}>
                                {section.kind === "list" && (
                                    <ListSection
                                        facet={section.facet}
                                        options={facets.lists[section.facet]!}
                                        counts={counts.lists[section.facet] ?? {}}
                                        chosen={selection.lists[section.facet] ?? []}
                                        searchable={section.searchable}
                                        onToggle={(value) => onChange(toggle_list_value(selection, section.facet, value))}
                                    />
                                )}

                                {section.kind === "range" && (
                                    <Range
                                        label={t(T_KEY[section.facet])}
                                        min={facets.ranges[section.facet]!.min}
                                        max={facets.ranges[section.facet]!.max}
                                        value={selection.ranges[section.facet] ?? [facets.ranges[section.facet]!.min, facets.ranges[section.facet]!.max]}
                                        onChange={(value) => onChange(set_range(selection, section.facet, value, facets))}
                                        fromLabel={t("from")}
                                        toLabel={t("to")}
                                        format={section.money ? format_price.bind(window, 1, read_cookie("Currency") as Supported_Currencies) : (n) => `${n}${section.unit ? ` ${section.unit}` : ""}`}
                                    />
                                )}

                                {section.kind === "includes" &&
                                    facets.includes.map((key) => (
                                        <Option
                                            key={key}
                                            label={t(`includes${key[0].toUpperCase()}${key.slice(1)}` as never)}
                                            count={counts.includes[key]}
                                            checked={selection.includes.includes(key)}
                                            onToggle={() => onChange(toggle_include(selection, key))}
                                        />
                                    ))}

                                {section.kind === "availability" && <Option label={t("inStock")} count={counts.inStock} checked={selection.inStockOnly} onToggle={() => onChange({ ...selection, inStockOnly: !selection.inStockOnly })} />}
                            </Accordion>
                        );
                    })}
                </div>

                {/* Mobile only: the count is the whole reason to keep filtering */}
                <footer className="shrink-0 border-t border-secondary/30 p-4 lg:hidden">
                    <button type="button" onClick={() => setOpen(false)} className="button w-full text-center">
                        {t("showResults", { count: resultCount })}
                    </button>
                </footer>
            </aside>
        </>
    );
}

function section_badge(section: Section, selection: Selection): number {
    if (section.kind === "list") return selection.lists[section.facet]?.length ?? 0;
    if (section.kind === "range") return selection.ranges[section.facet] ? 1 : 0;
    if (section.kind === "includes") return selection.includes.length;
    return selection.inStockOnly ? 1 : 0;
}

function Accordion({ title, badge, defaultOpen, children }: { title: string; badge: number; defaultOpen: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    const id = title.replace(/\s+/g, "-").toLowerCase();

    return (
        <section className="border-b border-secondary/30">
            <h3>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls={`filter-${id}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 py-4 text-start outline-none focus-visible:underline focus-visible:underline-offset-4"
                >
                    <span className="flex items-baseline gap-2 text-base">
                        {title}
                        {badge > 0 && <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background tabular-nums">{badge}</span>}
                    </span>
                    <Arrow classnames={`w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                </button>
            </h3>

            <div id={`filter-${id}`} className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-1 pb-4">{children}</div>
                </div>
            </div>
        </section>
    );
}

function ListSection({ facet, options, counts, chosen, searchable, onToggle }: { facet: ListFacet; options: string[]; counts: Record<string, number>; chosen: string[]; searchable?: boolean; onToggle: (value: string) => void }) {
    const t = useTranslations("common.filters");
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    }, [options, query]);

    const visible = expanded || query ? filtered : filtered.filter((o, i) => i < COLLAPSED_OPTIONS || chosen.includes(o));
    const hidden = filtered.length - visible.length;

    return (
        <>
            {searchable && options.length > COLLAPSED_OPTIONS && (
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={`${t("search")} ${t(T_KEY[facet])}`}
                    className="mb-2 w-full border-b border-secondary bg-transparent py-1 text-sm outline-none transition-default focus:border-foreground"
                />
            )}

            {visible.map((option) => (
                <Option key={option} label={translate_option(t, facet, option)} count={counts[option] ?? 0} checked={chosen.includes(option)} onToggle={() => onToggle(option)} />
            ))}

            {filtered.length === 0 && <p className="py-2 text-sm text-secondary">{t("noResults")}</p>}

            {hidden > 0 && !query && (
                <button type="button" onClick={() => setExpanded(true)} className="mt-1 w-fit cursor-pointer text-sm text-secondary underline underline-offset-4 transition-default hover:text-foreground">
                    {t("showAll", { count: hidden })}
                </button>
            )}
            {expanded && !query && filtered.length > COLLAPSED_OPTIONS && (
                <button type="button" onClick={() => setExpanded(false)} className="mt-1 w-fit cursor-pointer text-sm text-secondary underline underline-offset-4 transition-default hover:text-foreground">
                    {t("showLess")}
                </button>
            )}
        </>
    );
}

function Option({ label, count, checked, onToggle }: { label: string; count: number; checked: boolean; onToggle: () => void }) {
    const unavailable = count === 0 && !checked;

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={unavailable}
            onClick={onToggle}
            className={`flex w-full items-center gap-3 py-1.5 text-start outline-none transition-default focus-visible:underline focus-visible:underline-offset-4 capitalize ${
                unavailable ? "cursor-not-allowed opacity-35" : "cursor-pointer hover:opacity-100"
            } ${checked ? "opacity-100" : "opacity-75"}`}
        >
            <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-default ${checked ? "border-foreground bg-foreground text-background" : "border-secondary"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 transition-default ${checked ? "opacity-100" : "opacity-0"}`}>
                    <path d="M5 12.5 9.5 17 19 7.5" />
                </svg>
            </span>

            <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
            <span className="shrink-0 text-xs text-secondary tabular-nums">{count}</span>
        </button>
    );
}

function translate_option(t: ReturnType<typeof useTranslations>, facet: ListFacet, option: string): string {
    const map: Record<string, string> = {
        "condition:New": "conditionNew",
        "condition:Pre-Owned": "conditionPreOwned",
        "movement:Manual": "movementManual",
        "movement:Automatic": "movementAutomatic",
        "movement:Quartz": "movementQuartz",
    };
    const key = map[`${facet}:${option}`];
    return key ? t(key as never) : option;
}

export function ActiveFilters({ selection, onChange }: { selection: Selection; onChange: (selection: Selection) => void }) {
    const t = useTranslations("common.filters");
    const chips = active_chips(selection);
    if (chips.length === 0) return null;

    return (
        <ul aria-label={t("activeFilters")} className="flex flex-row flex-wrap items-center gap-2 py-1">
            {chips.map((chip) => (
                <li key={chip_key(chip)}>
                    <button type="button" onClick={() => onChange(remove_chip(selection, chip))} className="flex cursor-pointer items-center gap-2 border border-secondary/50 px-3 py-1 text-xs transition-default hover:border-foreground">
                        <span>{chip_label(t, chip)}</span>
                        <span aria-hidden="true" className="text-secondary">
                            ×
                        </span>
                        <span className="sr-only">{t("remove")}</span>
                    </button>
                </li>
            ))}

            <li>
                <button type="button" onClick={() => onChange(empty_selection())} className="cursor-pointer px-2 py-1 text-xs text-secondary underline underline-offset-4 transition-default hover:text-foreground">
                    {t("clearAll")}
                </button>
            </li>
        </ul>
    );
}

function chip_key(chip: ActiveChip): string {
    switch (chip.kind) {
        case "list":
            return `${chip.facet}:${chip.value}`;
        case "range":
            return `range:${chip.facet}`;
        case "include":
            return `include:${chip.value}`;
        case "stock":
            return "stock";
    }
}

function chip_label(t: ReturnType<typeof useTranslations>, chip: ActiveChip): string {
    switch (chip.kind) {
        case "list":
            return translate_option(t, chip.facet, chip.value);
        case "range": {
            const money = chip.facet === "price";
            const unit = chip.facet === "caseDiameterMm" ? " mm" : chip.facet === "waterResistanceM" ? " m" : "";
            const fmt = (n: number) => (money ? format_price(n, read_cookie("Currency") as Supported_Currencies) : `${n}${unit}`);
            return `${t(T_KEY[chip.facet])}: ${fmt(chip.value[0])} – ${fmt(chip.value[1])}`;
        }
        case "include":
            return t(`includes${chip.value[0].toUpperCase()}${chip.value.slice(1)}` as never);
        case "stock":
            return t("inStock");
    }
}

export type { IncludesKey, RangeFacet };
