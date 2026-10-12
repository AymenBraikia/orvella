export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    // if (process.env.NODE_ENV == "development") {
    //     return src;
    // }

    const productionDomain = "https://arvell.vercel.app";
    const fullSrc = src.startsWith("http") ? src : `${productionDomain}${src}`;

    return `https://wsrv.nl/?url=${encodeURIComponent(fullSrc)}&w=${width}&q=${quality || 75}&output=webp&maxage=31d`;
}