import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { verifyJwt } from "./app/[local]/(auth)/auth/jwt";
import { sanitizeRef } from "./i18n/brand";
import { save_visit } from "./app/server/save_visit";
import { country_to_currency } from "@/app/(site)/lib/price_format";
import { Supported_Countries, Supported_Currencies } from "./currency";

const handleI18nRouting = createMiddleware(routing);

const protectedRoutes = ["/cart", "/thank_you", "/checkout"];
const adminRoutes = ["/admin"];

function matches(pathname: string, routes: string[]): boolean {
    return routes.some((route) => {
        if (pathname === route || pathname.startsWith(`${route}/`)) return true;
        return routing.locales.some((locale) => pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`));
    });
}

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();

    const BOT = /facebookexternalhit|facebookcatalog|Instagram|WhatsApp|Twitterbot|Slackbot|Discordbot|TelegramBot|LinkedInBot|Googlebot|bingbot|Applebot|SkypeUriPreview|redditbot|Iframely|embedly/i;

    if (BOT.test(request.headers.get("user-agent") || "")) return handleI18nRouting(request);
    if (request.headers.get("purpose") == "prefetch") return handleI18nRouting(request);

    const isAdminRoute = matches(pathname, adminRoutes);
    const isProtectedRoute = isAdminRoute || matches(pathname, protectedRoutes);

    if (isProtectedRoute) {
        const token = request.cookies.get("accessToken")?.value;

        const loginUrl = new URL("/auth/log_in", request.url);

        loginUrl.searchParams.set("redirect", pathname);

        if (!token) return NextResponse.redirect(loginUrl);

        try {
            const payload = verifyJwt(token);
            if (!payload) return NextResponse.redirect(loginUrl);

            if (isAdminRoute && !payload.admin) return NextResponse.redirect(new URL("/not_found", request.url));
        } catch {
            return NextResponse.redirect(loginUrl);
        }
    }
    const response = handleI18nRouting(request);

    if (!request.cookies.get("Currency")?.value) {
        const country = (request.headers.get("x-vercel-ip-country") as Supported_Countries) || "US";
        const currency: Supported_Currencies = country_to_currency.get(country_to_currency.has(country) ? country : "US") || "USD";

        response.cookies.set("Currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
    }

    const ref = sanitizeRef(request.nextUrl.searchParams.get("ref"));
    if (ref) {
        response.cookies.set("ref", ref, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
        if (process.env.NODE_ENV == "production") save_visit(request);
    } else if (request.nextUrl.searchParams.has("ref")) {
        response.cookies.delete("ref");
    }

    return response;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
