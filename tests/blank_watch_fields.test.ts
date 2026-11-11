import { describe, expect, it } from "vitest";
import { apply_filters, build_facets, empty_selection } from "@/app/(site)/lib/filters";
import type { Item } from "@/types/item";

/* A watch can be listed without a known year (stored as 0). The shop filters must cope. */

const watch = (slug: string, year: number) => ({ slug, type: "watch", brand: "rolex", model: "Day-Date 40", reference: "", year, price: 48000, caseDiameterMm: 40, waterResistanceM: 100, inStock: true, boxPapers: { box: false, papers: false, firstInvoice: false, serviceInvoice: false } }) as unknown as Item;

describe("a watch with no known year", () => {
    const items = [watch("unknown", 0), watch("dated", 2019)];

    it("does not stretch the year filter back to year 0", () => {
        expect(build_facets([...items, watch("newer", 2023)]).ranges.year).toEqual({ min: 2019, max: 2023 });
    });

    it("offers no year filter when no watch has a known year", () => {
        expect(build_facets([watch("a", 0), watch("b", 0)]).ranges.year).toBeUndefined();
    });

    it("stays in the list while no year filter is set", () => {
        expect(apply_filters(items, empty_selection(), "")).toHaveLength(2);
    });

    it("is left out once a year range is chosen", () => {
        const selection = { ...empty_selection(), ranges: { year: [2000, 2025] } } as ReturnType<typeof empty_selection>;
        expect(apply_filters(items, selection, "").map((i) => i.slug)).toEqual(["dated"]);
    });
});
