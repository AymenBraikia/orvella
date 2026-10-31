import { existsSync } from "node:fs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Optional media for the /why page. Checked here because /public is not there at runtime on Vercel.
const WHY_MEDIA = ["dashboard.mp4", "dashboard-poster.webp", "shot-overview.webp", "shot-order.webp", "shot-product.webp", "shot-lead.webp"];

const nextConfig: NextConfig = {
    env: {
        // Lets the browser pick the upload path (Vercel Blob when a token exists, the dev-only local driver otherwise).
        NEXT_PUBLIC_UPLOAD_DRIVER: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
        // Public demo deployment (see app/[local]/(site)/lib/demo.ts).
        NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE === "true" ? "true" : "false",
        NEXT_PUBLIC_WHY_MEDIA: WHY_MEDIA.filter((file) => existsSync(`public/why/${file}`)).join(","),
    },
    // Images use Next's built-in optimisation (resized AVIF/WebP per device via `sizes`).
    images: {
        formats: ["image/avif", "image/webp"],
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
