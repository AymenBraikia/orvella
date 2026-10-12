/** "Audemars Piguet" -> "audemars-piguet" */
export function slugify(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function build_watch_slug(brand: string, model: string, reference: string, year: number | string): string {
    return slugify([brand, model, reference, String(year)].filter(Boolean).join(" "));
}
