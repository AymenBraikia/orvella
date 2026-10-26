import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
    env: {
        // Lets the browser pick the upload path (Vercel Blob when a token exists, the dev-only local driver otherwise).
        NEXT_PUBLIC_UPLOAD_DRIVER: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
    },
    // images: {
    //     qualities: [60, 65, 70, 75],
    //     loader: "custom",
    //     loaderFile: "./image_loader.ts",
    // },
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
