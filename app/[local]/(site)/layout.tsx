import { client_messages, SITE_CLIENT_NAMESPACES } from "@/i18n/client_messages";
import AuthGate from "@/app/components/AuthGate";

import { site_metadata } from "@/app/(site)/lib/site_metadata";
import type { Metadata, Viewport } from "next";
import { Open_Sans, Gelasio, Cormorant_Garamond, Tajawal, Lateef } from "next/font/google";
import "../globals.css";

import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getDirection } from "@/i18n/direction";

const tajawal = Tajawal({
    subsets: ["arabic"],
    weight: ["200", "300", "400", "500", "700", "800", "900"],
    variable: "--font-sans",
    display: "swap",
    // Arabic fonts are only used on /ar; don't make every other page download them.
    preload: false,
});
const lateef = Lateef({
    subsets: ["arabic"],
    weight: ["200", "300", "400", "500", "600", "700", "800"],
    variable: "--font-primary",
    display: "swap",
    preload: false,
});

const openSans = Open_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-primary",
    display: "swap",
});
const gelasio = Gelasio({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-secondary",
    display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ local: string }> }): Promise<Metadata> {
    return site_metadata((await params).local);
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: "#000000",
    colorScheme: "dark light",
};

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ local: string }>;
}>) {
    const { local } = await params;

    const direction = getDirection(local);

    const fonts_classes = direction == "ltr" ? `${openSans.variable} ${gelasio.variable} ${cormorantGaramond.variable}` : `${lateef.variable} ${tajawal.variable}`;

    return (
        <html lang={local} dir={direction} className={`${fonts_classes} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans">
                <Analytics />
                <SpeedInsights />

                <NextIntlClientProvider messages={await client_messages(SITE_CLIENT_NAMESPACES)}>
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                        {/* Rendered once: a Suspense fallback here used to render the whole page twice and swap it (layout shift). */}
                        <AuthGate>{children}</AuthGate>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
