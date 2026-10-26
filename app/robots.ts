import type { MetadataRoute } from "next";
import { absolute_url } from "@/app/(site)/lib/site_url";
import { DEMO_MODE } from "@/app/(site)/lib/demo";

export default function robots(): MetadataRoute.Robots {
    // A public demo must not be indexed as if it were a real shop.
    if (DEMO_MODE) return { rules: { userAgent: "*", disallow: "/" } };

    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/private/"] },
        sitemap: absolute_url("/sitemap.xml"),
    };
}
