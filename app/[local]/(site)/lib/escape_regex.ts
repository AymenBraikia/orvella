/** Make user input safe to embed in a MongoDB $regex (no injected patterns, no ReDoS). */
export function escape_regex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
