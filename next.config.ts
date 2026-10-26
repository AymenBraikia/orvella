import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
    env: {
        // Lets the browser pick the upload path (Vercel Blob when a token exists, the dev-only local driver otherwise).
        NEXT_PUBLIC_UPLOAD_DRIVER: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
    },
    images: {
        // Product photos uploaded from the admin are served from Vercel Blob.
        remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    },
    // images: {
    //     qualities: [60, 65, 70, 75],
    //     loader: "custom",
    //     loaderFile: "./image_loader.ts",
    // },
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
