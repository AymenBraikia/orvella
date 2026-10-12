import type { Watch } from "@/types/watch";
import type { Spare } from "@/types/spare";

export type Item = Watch | Spare;
export type Bounds = { min: number; max: number };

export const LIST_FACETS = ["brand", "condition", "movement", "caseMaterial", "braceletMaterial", "dialColor"] as const;
export type ListFacet = (typeof LIST_FACETS)[number];

export const RANGE_FACETS = ["price", "caseDiameterMm", "year", "waterResistanceM"] as const;
export type RangeFacet = (typeof RANGE_FACETS)[number];

export const INCLUDES_KEYS = ["box", "papers", "firstInvoice", "serviceInvoice"] as const;
export type IncludesKey = (typeof INCLUDES_KEYS)[number];

export type Dimension = ListFacet | RangeFacet | "includes" | "availability" | "query";

const ALL_DIMENSIONS: Dimension[] = [...LIST_FACETS, ...RANGE_FACETS, "includes", "availability", "query"];

const UNVERIFIED = "UNVERIFIED";

/** What the catalogue actually contains. Derived once from the data. */
export type Facets = {
    lists: Partial<Record<ListFacet, string[]>>;
    ranges: Partial<Record<RangeFacet, Bounds>>;
    includes: IncludesKey[];
    /** Only true when the catalogue holds both in-stock and sold-out items. */
    hasStockSplit: boolean;
};

/** What the user has picked. An absent range means "untouched". */
export type Selection = {
    lists: Partial<Record<ListFacet, string[]>>;
    ranges: Partial<Record<RangeFacet, [number, number]>>;
    includes: IncludesKey[];
    inStockOnly: boolean;
};

/* ---------------------------------- accessors --------------------------- */

function list_value(item: Item, facet: ListFacet): string {
    switch (facet) {
        case "brand":
            return item.brand;
        case "condition":
            return item.condition;
        case "movement":
            return item.movement;
        case "caseMaterial":
            return item.caseMaterial;
        case "braceletMaterial":
            return item.braceletMaterial;
        case "dialColor":
            return item.dialColor;
    }
}

function range_value(item: Item, facet: RangeFacet): number {
    switch (facet) {
        case "price":
            return item.price;
        case "caseDiameterMm":
            return item.caseDiameterMm;
        case "year":
            return item.year;
        case "waterResistanceM":
            return item.waterResistanceM;
    }
}

/* ---------------------------------- facets ------------------------------ */

export function build_facets(items: Item[]): Facets {
    const sets = Object.fromEntries(LIST_FACETS.map((f) => [f, new Set<string>()])) as Record<ListFacet, Set<string>>;
    const ranges = Object.fromEntries(RANGE_FACETS.map((f) => [f, { min: Infinity, max: -Infinity }])) as Record<RangeFacet, Bounds>;
    const includes = new Set<IncludesKey>();

    let inStock = 0;
    let soldOut = 0;

    for (const item of items) {
        for (const facet of LIST_FACETS) {
            const value = list_value(item, facet);
            if (value && value !== UNVERIFIED) sets[facet].add(value);
        }

        for (const facet of RANGE_FACETS) {
            const value = range_value(item, facet);
            if (typeof value !== "number" || !Number.isFinite(value)) continue;

            // Two separate ifs. The original used `if / else if`, so on the very
            // first item the `if` always won and `max` was left at -Infinity.
            if (value < ranges[facet].min) ranges[facet].min = value;
            if (value > ranges[facet].max) ranges[facet].max = value;
        }

        for (const key of INCLUDES_KEYS) {
            if (item.boxPapers?.[key]) includes.add(key);
        }

        if (item.inStock) inStock++;
        else soldOut++;
    }

    const lists: Facets["lists"] = {};
    for (const facet of LIST_FACETS) {
        // A facet with one value can't narrow anything, so don't show it.
        if (sets[facet].size > 1) lists[facet] = [...sets[facet]].sort(compare_option(facet));
    }

    const usable_ranges: Facets["ranges"] = {};
    for (const facet of RANGE_FACETS) {
        const { min, max } = ranges[facet];
        if (Number.isFinite(min) && Number.isFinite(max) && max > min) usable_ranges[facet] = { min, max };
    }

    return {
        lists,
        ranges: usable_ranges,
        includes: INCLUDES_KEYS.filter((k) => includes.has(k)),
        hasStockSplit: inStock > 0 && soldOut > 0,
    };
}

/** Movement and condition read better in a fixed order than alphabetically. */
function compare_option(facet: ListFacet) {
    const fixed: Partial<Record<ListFacet, string[]>> = {
        condition: ["New", "Pre-Owned"],
        movement: ["Automatic", "Manual", "Quartz"],
    };
    const order = fixed[facet];
    if (!order) return (a: string, b: string) => a.localeCompare(b);

    return (a: string, b: string) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi) || a.localeCompare(b);
    };
}

/* --------------------------------- selection ---------------------------- */

export function empty_selection(): Selection {
    return { lists: {}, ranges: {}, includes: [], inStockOnly: false };
}

export function toggle_list_value(selection: Selection, facet: ListFacet, value: string): Selection {
    const current = selection.lists[facet] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

    const lists = { ...selection.lists };
    if (next.length) lists[facet] = next;
    else delete lists[facet];

    return { ...selection, lists };
}

export function toggle_include(selection: Selection, key: IncludesKey): Selection {
    const next = selection.includes.includes(key) ? selection.includes.filter((k) => k !== key) : [...selection.includes, key];
    return { ...selection, includes: next };
}

/** Dropping back to the full bounds clears the range instead of storing a no-op. */
export function set_range(selection: Selection, facet: RangeFacet, value: [number, number], facets: Facets): Selection {
    const bounds = facets.ranges[facet];
    const ranges = { ...selection.ranges };

    if (bounds && value[0] <= bounds.min && value[1] >= bounds.max) delete ranges[facet];
    else ranges[facet] = value;

    return { ...selection, ranges };
}

export function count_active(selection: Selection): number {
    const lists = Object.values(selection.lists).reduce((n, values) => n + (values?.length ?? 0), 0);
    return lists + Object.keys(selection.ranges).length + selection.includes.length + (selection.inStockOnly ? 1 : 0);
}

/* --------------------------------- matching ----------------------------- */

export function match_query(item: Item, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const haystack = [item.brand, item.model, item.reference, item.caseMaterial, item.dialColor, item.movement, item.year?.toString() ?? ""].join(" ").toLowerCase();

    return q.split(/\s+/).every((term) => haystack.includes(term));
}

function matches(item: Item, dimension: Dimension, selection: Selection, query: string): boolean {
    if (dimension === "query") return match_query(item, query);

    if (dimension === "availability") {
        // Unticking must mean "no constraint", not "sold out only".
        return !selection.inStockOnly || item.inStock;
    }

    if (dimension === "includes") {
        // Every ticked extra must be present. Extras the watch also has are fine.
        return selection.includes.every((key) => Boolean(item.boxPapers?.[key]));
    }

    if ((RANGE_FACETS as readonly string[]).includes(dimension)) {
        const facet = dimension as RangeFacet;
        const range = selection.ranges[facet];
        if (!range) return true;

        const value = range_value(item, facet);
        return value >= range[0] && value <= range[1];
    }

    const facet = dimension as ListFacet;
    const chosen = selection.lists[facet];
    if (!chosen?.length) return true;

    // OR within a facet, AND across facets — the standard faceting contract.
    return chosen.includes(list_value(item, facet));
}

/**
 * `except` skips one dimension. That's what makes honest option counts possible:
 * counts for Brand are computed with every filter applied *but* Brand, so ticking
 * a second brand widens the results rather than showing zero everywhere.
 */
export function apply_filters(items: Item[], selection: Selection, query: string, except?: Dimension): Item[] {
    return items.filter((item) => ALL_DIMENSIONS.every((dimension) => dimension === except || matches(item, dimension, selection, query)));
}

/* ----------------------------------- counts ----------------------------- */

export type FacetCounts = {
    lists: Partial<Record<ListFacet, Record<string, number>>>;
    includes: Record<IncludesKey, number>;
    inStock: number;
};

export function facet_counts(items: Item[], facets: Facets, selection: Selection, query: string): FacetCounts {
    const lists: FacetCounts["lists"] = {};

    for (const facet of LIST_FACETS) {
        const values = facets.lists[facet];
        if (!values) continue;

        const counts: Record<string, number> = Object.fromEntries(values.map((v) => [v, 0]));
        for (const item of apply_filters(items, selection, query, facet)) {
            const value = list_value(item, facet);
            if (value in counts) counts[value]++;
        }
        lists[facet] = counts;
    }

    const includes_pool = apply_filters(items, selection, query, "includes");
    const includes = Object.fromEntries(INCLUDES_KEYS.map((key) => [key, includes_pool.filter((item) => Boolean(item.boxPapers?.[key])).length])) as Record<IncludesKey, number>;

    const inStock = apply_filters(items, selection, query, "availability").filter((item) => item.inStock).length;

    return { lists, includes, inStock };
}

/* ----------------------------------- chips ------------------------------ */

export type ActiveChip = { kind: "list"; facet: ListFacet; value: string } | { kind: "range"; facet: RangeFacet; value: [number, number] } | { kind: "include"; value: IncludesKey } | { kind: "stock" };

export function active_chips(selection: Selection): ActiveChip[] {
    const chips: ActiveChip[] = [];

    for (const facet of LIST_FACETS) {
        for (const value of selection.lists[facet] ?? []) chips.push({ kind: "list", facet, value });
    }
    for (const facet of RANGE_FACETS) {
        const value = selection.ranges[facet];
        if (value) chips.push({ kind: "range", facet, value });
    }
    for (const value of selection.includes) chips.push({ kind: "include", value });
    if (selection.inStockOnly) chips.push({ kind: "stock" });

    return chips;
}

export function remove_chip(selection: Selection, chip: ActiveChip): Selection {
    switch (chip.kind) {
        case "list":
            return toggle_list_value(selection, chip.facet, chip.value);
        case "range": {
            const ranges = { ...selection.ranges };
            delete ranges[chip.facet];
            return { ...selection, ranges };
        }
        case "include":
            return toggle_include(selection, chip.value);
        case "stock":
            return { ...selection, inStockOnly: false };
    }
}

/* ---------------------------------- url sync ---------------------------- */

export function selection_to_params(selection: Selection): URLSearchParams {
    const params = new URLSearchParams();

    for (const facet of LIST_FACETS) {
        const values = selection.lists[facet];
        if (values?.length) params.set(facet, values.join(","));
    }
    for (const facet of RANGE_FACETS) {
        const range = selection.ranges[facet];
        if (range) params.set(facet, `${range[0]}-${range[1]}`);
    }
    if (selection.includes.length) params.set("includes", selection.includes.join(","));
    if (selection.inStockOnly) params.set("inStock", "1");

    return params;
}

/** Values not present in the catalogue are dropped, so a stale link degrades quietly. */
export function selection_from_params(params: URLSearchParams, facets: Facets): Selection {
    const selection = empty_selection();

    for (const facet of LIST_FACETS) {
        const raw = params.get(facet);
        const allowed = facets.lists[facet];
        if (!raw || !allowed) continue;

        const values = raw.split(",").filter((v) => allowed.includes(v));
        if (values.length) selection.lists[facet] = values;
    }

    for (const facet of RANGE_FACETS) {
        const raw = params.get(facet);
        const bounds = facets.ranges[facet];
        if (!raw || !bounds) continue;

        const [from, to] = raw.split("-").map(Number);
        if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) continue;

        const clamped: [number, number] = [Math.max(bounds.min, from), Math.min(bounds.max, to)];
        if (clamped[0] > bounds.min || clamped[1] < bounds.max) selection.ranges[facet] = clamped;
    }

    const includes = params.get("includes");
    if (includes) selection.includes = includes.split(",").filter((k): k is IncludesKey => facets.includes.includes(k as IncludesKey));

    selection.inStockOnly = params.get("inStock") === "1" && facets.hasStockSplit;

    return selection;
}
