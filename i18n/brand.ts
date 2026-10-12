export const DEFAULT_BRAND = "Arvell";

export function sanitizeRef(raw?: string | null): string | null {
    if (!raw) return null;
    const clean = raw
        .trim()
        .replace(/[^\p{L}\p{N}\s.&'-]/gu, "")
        .slice(0, 24);
    return clean.length >= 2 ? clean : null;
}

export function applyBrand<T>(node: T, brand: string): T {
    if (typeof node === "string") {
        return node
            .replace(/arvell\.com/g, `${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)
            .replace(/ARVELL/g, brand.toUpperCase())
            .replace(/Arvell/g, brand) as T;
    }
    if (Array.isArray(node)) return node.map((n) => applyBrand(n, brand)) as T;
    if (node && typeof node === "object") {
        return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, applyBrand(v, brand)])) as T;
    }
    return node;
}
