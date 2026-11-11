"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Watch_card from "@/app/components/watch_card";
import ItemsFilter, { ActiveFilters } from "@/app/components/items_filter";
import Select from "./elements/select";
import Input from "./elements/input";

import { apply_filters, build_facets, count_active, empty_selection, facet_counts, selection_from_params, selection_to_params, type Selection } from "../(site)/lib/filters";
import Item_card from "./Item_card";
import { Item } from "@/types/item";
import { stock_rank } from "../(site)/lib/stock";
import { brand_name } from "../(site)/lib/brand_name";
import { item_name } from "../(site)/lib/item_name";

const QuickViewModal = dynamic(() => import("@/app/components/quick_view"), { ssr: false });

const PAGE_SIZE = 30;

/* Stable keys, not translated strings. The old version stored t("newest") in
   state, so switching language silently broke sorting. */
const SORT_KEYS = ["newest", "relevance", "priceLowToHigh", "priceHighToLow", "brand"] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_LABEL: Record<SortKey, string> = {
    newest: "newest",
    relevance: "relevance",
    priceLowToHigh: "priceLowToHight",
    priceHighToLow: "priceHightToLow",
    brand: "brand",
};

const COMPARATORS: Record<SortKey, (a: Item, b: Item) => number> = {
    newest: (a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
    relevance: (a, b) => b.relevance_score - a.relevance_score,
    priceLowToHigh: (a, b) => a.price - b.price,
    priceHighToLow: (a, b) => b.price - a.price,
    brand: (a, b) => ((a.type == "watch" || a.type == "spare") && (b.type == "watch" || b.type == "spare") ? a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model) : a.display_name.localeCompare(b.display_name)),
};

export default function Display_list({ items }: { items: Item[] }) {
    const t = useTranslations("common.filters");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [view, setView] = useState<Item | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("newest");
    const [limit, setLimit] = useState(PAGE_SIZE);
    // Someone arriving from the consultation quiz wants what they can buy, whatever the sort order.
    const [stock_first] = useState(() => searchParams.get("from") == "quiz");

    const facets = useMemo(() => build_facets(items), [items]);

    const [selection, setSelection] = useState<Selection>(() => empty_selection());

    /* Read filters out of the URL once the facets exist, so a shared link
       restores the same view and the back button works. */
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        setSelection(selection_from_params(new URLSearchParams(searchParams.toString()), facets));
    }, [facets, searchParams]);

    const updateSelection = useCallback(
        (next: Selection) => {
            setSelection(next);
            setLimit(PAGE_SIZE);

            const params = selection_to_params(next);
            if (stock_first) params.set("from", "quiz");
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [pathname, router, stock_first],
    );

    const filtered = useMemo(() => apply_filters(items, selection, query), [items, selection, query]);
    const counts = useMemo(() => facet_counts(items, facets, selection, query), [items, facets, selection, query]);

    /* Sort the whole result set, then slice. The old code truncated inside the
       filter predicate, so "price low to high" only sorted the first 30 matches. */
    const sorted = useMemo(() => [...filtered].sort((a, b) => (stock_first ? stock_rank(a) - stock_rank(b) : 0) || COMPARATORS[sortKey](a, b)), [filtered, sortKey, stock_first]);
    const visible = useMemo(() => sorted.slice(0, limit), [sorted, limit]);

    const sentinel = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const target = sentinel.current;
        if (!target || limit >= sorted.length) return;

        const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setLimit((prev) => Math.min(prev + PAGE_SIZE, sorted.length)), {
            rootMargin: "400px",
        });

        observer.observe(target);
        return () => observer.disconnect();
    }, [limit, sorted.length]);

    const activeCount = count_active(selection);
    const sortLabels = SORT_KEYS.map((key) => ({ key, label: t(SORT_LABEL[key]) }));

    return (
        <>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-10">
                <ItemsFilter facets={facets} counts={counts} selection={selection} onChange={updateSelection} resultCount={sorted.length} open={drawerOpen} setOpen={setDrawerOpen} />

                <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="w-full max-w-md">
                            <Input
                                label={t("search")}
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setLimit(PAGE_SIZE);
                                }}
                            />
                        </div>

                        <div className="flex w-full items-end justify-between gap-4 sm:w-auto sm:justify-end">
                            <Select
                                label={t("sort")}
                                value={sortLabels.find((o) => o.key === sortKey)!.label}
                                options={sortLabels.map((o) => o.label)}
                                // Select hands back a display string; map it to the stable key.
                                set_value={
                                    ((label: string) => {
                                        const match = sortLabels.find((o) => o.label === label);
                                        if (match) setSortKey(match.key);
                                    }) as never
                                }
                            />

                            <button type="button" onClick={() => setDrawerOpen(true)} className="button flex shrink-0 items-center gap-2 lg:hidden">
                                {t("filtersLabel")}
                                {activeCount > 0 && <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background tabular-nums">{activeCount}</span>}
                            </button>
                        </div>
                    </div>

                    <ActiveFilters selection={selection} onChange={updateSelection} />

                    {/* Scale, which the page never communicated before */}
                    <p aria-live="polite" className="text-sm text-secondary tabular-nums">
                        {t("resultCount", { count: sorted.length })}
                    </p>

                    {sorted.length > 0 ? (
                        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                            {visible.map((item) =>
                                item.type == "watch" || item.type == "spare" ? (
                                    <Watch_card
                                        key={item.slug}
                                        slug={item.slug}
                                        brand={brand_name(item.brand)}
                                        name={item_name(item)}
                                        movement={item.movement}
                                        size={item.caseDiameterMm}
                                        caseMaterial={item.caseMaterial}
                                        condition={item.condition}
                                        price={item.price}
                                        image_src={item.images[0]}
                                        video_src={item.video}
                                        braceletMaterial={item.braceletMaterial}
                                        description={item.description}
                                        status={item.stock_status}
                                    />
                                ) : (
                                    <Item_card
                                        key={item.slug}
                                        data={item}
                                    />
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-4 py-16">
                            <p className="font-secondary title5">{t("noResults")}</p>
                            {activeCount > 0 && (
                                <button type="button" onClick={() => updateSelection(empty_selection())} className="button">
                                    {t("clearAll")}
                                </button>
                            )}
                        </div>
                    )}

                    <div ref={sentinel} aria-hidden="true" className="h-px w-full" />
                </div>
            </div>

            {view && <QuickViewModal view={view} onClose={() => setView(null)} />}
        </>
    );
}
