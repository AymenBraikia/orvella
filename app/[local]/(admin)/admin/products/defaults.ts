import type { Item } from "@/types/item";
import type { ProductType } from "./schema";

type State = Record<string, unknown>;

/** Blank form values for a new product of `type`. */
export function empty_product(type: ProductType): State {
    const base = { type, slug: "", price: "", condition: "Pre-Owned", gender: "Men", images: [], video: "", description: "", featured: false, quantity: 1, preview: "" };
    const watch = {
        brand: "",
        model: "",
        reference: "",
        year: new Date().getFullYear(),
        movement: "Automatic",
        caseMaterial: "",
        caseDiameterMm: "",
        braceletMaterial: "",
        dialColor: "",
        waterResistanceM: "",
        boxPapers: { box: false, papers: false, firstInvoice: false, serviceInvoice: false },
    };
    const jewelry = { display_name: "", weight: "", measurement_unit: "grams", metal_type: "Gold", fineness: "", karats: "", stones: [] };

    switch (type) {
        case "watch":
            return { ...base, ...watch };
        case "spare":
            return { ...base, ...watch, partName: "", spareCategory: "Other", compatibleModels: [], tags: [] };
        case "ring":
            return { ...base, ...jewelry, ring_size: "", band_width: "" };
        default:
            return { ...base, ...jewelry, length: "", length_unit: "cm", clasp_type: "" };
    }
}

/** Form values for editing an existing item (system fields such as stock and dates are left out). */
export function form_from_item(item: Item): State {
    const blank = empty_product(item.type);
    const values: State = {};
    for (const key of Object.keys(blank)) {
        const v = (item as unknown as State)[key];
        values[key] = v === undefined || v === null ? blank[key] : v;
    }
    values.slug = item.slug;
    values.quantity = item.quantity ?? (item.inStock === false ? 0 : 1);
    return values;
}
