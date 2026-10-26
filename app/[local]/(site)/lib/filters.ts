import type { Watch } from "@/types/watch";
import type { Spare } from "@/types/spare";
import type { Bracelet, Necklace, Ring } from "@/types/jewelry";

export type Item = Watch | Spare | Necklace | Ring | Bracelet;
export type Bounds = { min: number; max: number };

export const LIST_FACETS = ["brand", "gender", "condition", "movement", "caseMaterial", "braceletMaterial", "dialColor"] as const;
export type ListFacet = (typeof LIST_FACETS)[number];

export const RANGE_FACETS = ["price", "caseDiameterMm", "year", "waterResistanceM"] as const;
export type RangeFacet = (typeof RANGE_FACETS)[number];

export const INCLUDES_KEYS = ["box", "papers", "firstInvoice", "serviceInvoice"] as const;
export type IncludesKey = (typeof INCLUDES_KEYS)[number];

export type Dimension = ListFacet | RangeFacet | "includes" | "availability" | "query";

const ALL_DIMENSIONS: Dimension[] = [...LIST_FACETS, ...RANGE_FACETS, "includes", "availability", "query"];
const UNVERIFIED = "UNVERIFIED";

export type Facets = {
    lists: Partial<Record<ListFacet, string[]>>;
    ranges: Partial<Record<RangeFacet, Bounds>>;
    includes: IncludesKey[];
    hasStockSplit: boolean;
};

export type Selection = {
    lists: Partial<Record<ListFacet, string[]>>;
    ranges: Partial<Record<RangeFacet, [number, number]>>;
    includes: IncludesKey[];
    inStockOnly: boolean;
};

function isWatchOrSpare(item: Item): item is Watch | Spare {
    return item.type === "watch" || item.type === "spare";
}

function list_value(item: Item, facet: ListFacet): string | undefined {
    switch (facet) {
        case "brand":
            return isWatchOrSpare(item) ? item.brand : undefined;
        case "gender":
            return item.gender;
        case "condition":
            return item.condition;
        case "movement":
            return isWatchOrSpare(item) ? item.movement : undefined;
        case "caseMaterial":
            return isWatchOrSpare(item) ? item.caseMaterial : undefined;
        case "braceletMaterial":
            return isWatchOrSpare(item) ? item.braceletMaterial : undefined;
        case "dialColor":
            return isWatchOrSpare(item) ? item.dialColor : undefined;
    }
}

function range_value(item: Item, facet: RangeFacet): number | undefined {
    switch (facet) {
        case "price":
            return item.price;
        case "caseDiameterMm":
            return isWatchOrSpare(item) ? item.caseDiameterMm : undefined;
        case "year":
            return isWatchOrSpare(item) ? item.year : undefined;
        case "waterResistanceM":
            return isWatchOrSpare(item) ? item.waterResistanceM : undefined;
    }
}

function box_papers(item: Item): Watch["boxPapers"] | undefined {
    return isWatchOrSpare(item) ? item.boxPapers : undefined;
}

export function build_facets(items: Item[]): Facets {
    const sets = Object.fromEntries(LIST_FACETS.map((facet) => [facet, new Set<string>()])) as Record<ListFacet, Set<string>>;
    const ranges = Object.fromEntries(RANGE_FACETS.map((facet) => [facet, { min: Infinity, max: -Infinity }])) as Record<RangeFacet, Bounds>;
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
            if (value < ranges[facet].min) ranges[facet].min = value;
            if (value > ranges[facet].max) ranges[facet].max = value;
        }

        const extras = box_papers(item);
        for (const key of INCLUDES_KEYS) {
            if (extras?.[key]) includes.add(key);
        }

        if (item.inStock) inStock++;
        else soldOut++;
    }

    const lists: Facets["lists"] = {};
    for (const facet of LIST_FACETS) {
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
        includes: INCLUDES_KEYS.filter((key) => includes.has(key)),
        hasStockSplit: inStock > 0 && soldOut > 0,
    };
}

function compare_option(facet: ListFacet) {
    const fixed: Partial<Record<ListFacet, string[]>> = {
        condition: ["New", "Pre-Owned"],
        gender: ["Women", "Men"],
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

export function empty_selection(): Selection {
    return { lists: {}, ranges: {}, includes: [], inStockOnly: false };
}

export function toggle_list_value(selection: Selection, facet: ListFacet, value: string): Selection {
    const current = selection.lists[facet] ?? [];
    const next = current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];

    const lists = { ...selection.lists };
    if (next.length) lists[facet] = next;
    else delete lists[facet];

    return { ...selection, lists };
}

export function toggle_include(selection: Selection, key: IncludesKey): Selection {
    const next = selection.includes.includes(key) ? selection.includes.filter((entry) => entry !== key) : [...selection.includes, key];
    return { ...selection, includes: next };
}

export function set_range(selection: Selection, facet: RangeFacet, value: [number, number], facets: Facets): Selection {
    const bounds = facets.ranges[facet];
    const ranges = { ...selection.ranges };

    if (bounds && value[0] <= bounds.min && value[1] >= bounds.max) delete ranges[facet];
    else ranges[facet] = value;

    return { ...selection, ranges };
}

export function count_active(selection: Selection): number {
    const lists = Object.values(selection.lists).reduce((count, values) => count + (values?.length ?? 0), 0);
    return lists + Object.keys(selection.ranges).length + selection.includes.length + (selection.inStockOnly ? 1 : 0);
}

export function match_query(item: Item, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const values: unknown[] = [item.slug, item.display_name, item.description, item.condition, item.gender, item.price, item.type];

    if (isWatchOrSpare(item)) {
        values.push(item.brand, item.brandSlug, item.model, item.reference, item.year, item.movement, item.caseMaterial, item.caseDiameterMm, item.braceletMaterial, item.dialColor, item.waterResistanceM);

        if (item.type === "spare") values.push(item.partName, item.spareCategory, item.compatibleModels, item.tags);
    } else {
        values.push(item.weight, item.measurement_unit, item.metal_type, item.fineness, item.karats, item.stones);

        if (item.type === "ring") values.push(item.ring_size, item.band_width);
        else values.push(item.length, item.length_unit, item.clasp_type);
    }

    const haystack = values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

    return q.split(/\s+/).every((term) => haystack.includes(term));
}

function matches(item: Item, dimension: Dimension, selection: Selection, query: string): boolean {
    if (dimension === "query") return match_query(item, query);

    if (dimension === "availability") return !selection.inStockOnly || item.inStock;

    if (dimension === "includes") {
        const extras = box_papers(item);
        return selection.includes.every((key) => Boolean(extras?.[key]));
    }

    if ((RANGE_FACETS as readonly string[]).includes(dimension)) {
        const facet = dimension as RangeFacet;
        const range = selection.ranges[facet];
        if (!range) return true;

        const value = range_value(item, facet);
        return value !== undefined && value >= range[0] && value <= range[1];
    }

    const facet = dimension as ListFacet;
    const chosen = selection.lists[facet];
    if (!chosen?.length) return true;

    const value = list_value(item, facet);
    return value !== undefined && chosen.includes(value);
}

export function apply_filters(items: Item[], selection: Selection, query: string, except?: Dimension): Item[] {
    return items.filter((item) => ALL_DIMENSIONS.every((dimension) => dimension === except || matches(item, dimension, selection, query)));
}

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

        const counts: Record<string, number> = Object.fromEntries(values.map((value) => [value, 0]));
        for (const item of apply_filters(items, selection, query, facet)) {
            const value = list_value(item, facet);
            if (value !== undefined && value in counts) counts[value]++;
        }
        lists[facet] = counts;
    }

    const includes_pool = apply_filters(items, selection, query, "includes");
    const includes = Object.fromEntries(INCLUDES_KEYS.map((key) => [key, includes_pool.filter((item) => Boolean(box_papers(item)?.[key])).length])) as Record<IncludesKey, number>;

    const inStock = apply_filters(items, selection, query, "availability").filter((item) => item.inStock).length;

    return { lists, includes, inStock };
}

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

export function selection_from_params(params: URLSearchParams, facets: Facets): Selection {
    const selection = empty_selection();

    for (const facet of LIST_FACETS) {
        const raw = params.get(facet);
        const allowed = facets.lists[facet];
        if (!raw || !allowed) continue;

        const values = raw.split(",").filter((value) => allowed.includes(value));
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
    if (includes) selection.includes = includes.split(",").filter((key): key is IncludesKey => facets.includes.includes(key as IncludesKey));

    selection.inStockOnly = params.get("inStock") === "1" && facets.hasStockSplit;

    return selection;
}
