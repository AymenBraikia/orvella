/** Only allow same-site relative paths, so ?redirect= can't send users to another origin. */
export function safe_redirect(value: string | null | undefined): string | null {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
    return value;
}
