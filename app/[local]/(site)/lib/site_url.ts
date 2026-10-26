/** Public origin of the site, e.g. https://orvella-demo.vercel.app — set NEXT_PUBLIC_BASE_URL per deployment. */
export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

export function absolute_url(path = "/"): string {
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
