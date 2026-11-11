import { existsSync, readdirSync } from "node:fs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Optional media for the /why page. Checked here because /public is not there at runtime on Vercel.
const WHY_MEDIA = ["dashboard.mp4", "dashboard-poster.webp", "shot-overview.webp", "shot-order.webp", "shot-product.webp", "shot-lead.webp"];

// Private lead demos (demos/<slug>.json, shown at /<locale>/<slug>): never indexed, pages and files alike.
const LEAD_DEMOS = existsSync("demos") ? readdirSync("demos").filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length)) : [];
const NO_INDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
    env: {
        // Lets the browser pick the upload path: Vercel Blob with a read-write token, Vercel Blob through presigned
        // URLs (newer stores, BLOB_STORE_ID only), or the dev-only local driver.
        NEXT_PUBLIC_UPLOAD_DRIVER: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : process.env.BLOB_STORE_ID ? "vercel-blob-presigned" : "local",
        // Public demo deployment (see app/[local]/(site)/lib/demo.ts).
        NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE === "true" ? "true" : "false",
        NEXT_PUBLIC_WHY_MEDIA: WHY_MEDIA.filter((file) => existsSync(`public/why/${file}`)).join(","),
    },
    // Images are resized by wsrv.nl (see image_loader.ts), not by Vercel's optimizer.
    images: {
        loader: "custom",
        loaderFile: "./image_loader.ts",
        qualities: [60, 65, 70, 75],
        // Product photos uploaded from the admin are served from Vercel Blob.
        remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    },
    async redirects() {
        // One polishing page: /polish. The old /info/polishing duplicate redirects there.
        return [
            { source: "/:locale(en|de|es|ar|fr|tr|it)/info/polishing", destination: "/:locale/polish", permanent: true },
            { source: "/info/polishing", destination: "/polish", permanent: true },
        ];
    },
    async headers() {
        return LEAD_DEMOS.flatMap((slug) => [
            { source: `/:locale/${slug}/:path*`, headers: NO_INDEX },
            { source: `/demos/${slug}/:path*`, headers: NO_INDEX },
        ]);
    },
    experimental: {
        optimizeCss: true,
    },
    turbopack: {
        resolveAlias: {
            "core-js": { browser: "./empty.js" },
        },
    },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
