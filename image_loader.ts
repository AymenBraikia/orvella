/**
 * Images are resized by wsrv.nl instead of Vercel's optimizer, whose free quota runs out fast.
 * wsrv fetches the original from the public site, so it needs NEXT_PUBLIC_BASE_URL. Without a
 * public address (local development) the original file is served as it is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
    const is_absolute = src.startsWith("http");

    if (src.endsWith(".svg") || (!is_absolute && /\/\/(localhost|127\.0\.0\.1)\b/.test(base))) return src;

    const full_src = is_absolute ? src : `${base}${src}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(full_src)}&w=${width}&q=${quality || 75}&output=webp&maxage=31d`;
}
