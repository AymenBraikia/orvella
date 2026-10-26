import type { MetadataRoute } from "next";
import { absolute_url } from "@/app/(site)/lib/site_url";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/private/"] },
        sitemap: absolute_url("/sitemap.xml"),
    };
}
