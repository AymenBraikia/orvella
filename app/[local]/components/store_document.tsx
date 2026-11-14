import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { client_messages, SITE_CLIENT_NAMESPACES } from "@/i18n/client_messages";
import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { getDirection } from "@/i18n/direction";
import AuthGate from "@/app/components/AuthGate";
import "../globals.css";
import AnalyticsTracker from "./analytics/tracker";
import AnalyticsOneTime from "./analytics/one_time";

/**
 * The storefront's document: fonts, theme, translations, and the header, footer and cart around the
 * page (AuthGate). Shared by the store's layout and the lead demos' layout (which can force the dark
 * theme and swap the store's gold for the seller's colour).
 */
export default async function StoreDocument({ local, fonts, forced_theme, accent, children }: { local: string; fonts: string; forced_theme?: "dark"; accent?: string; children: React.ReactNode }) {
    const direction = getDirection(local);

    return (
        <html lang={local} dir={direction} className={`${fonts} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans" style={accent ? ({ "--clr-gold": accent } as React.CSSProperties) : undefined}>
                <Analytics />
                <AnalyticsOneTime />
                <AnalyticsTracker />
                <SpeedInsights />
                <NextIntlClientProvider messages={await client_messages(SITE_CLIENT_NAMESPACES)}>
                    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme={forced_theme} enableSystem disableTransitionOnChange>
                        {/* Rendered once: a Suspense fallback here used to render the whole page twice and swap it (layout shift). */}
                        <AuthGate>{children}</AuthGate>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
