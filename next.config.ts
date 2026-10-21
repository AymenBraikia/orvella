import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
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
