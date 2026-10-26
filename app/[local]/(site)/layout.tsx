import { Suspense } from "react";
import AuthGate from "@/app/components/AuthGate";
import AuthShell from "@/app/components/AuthShell";

import { absolute_url, BASE_URL } from "@/app/(site)/lib/site_url";
import { store_identity } from "@/app/server/store_identity";
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
});
const lateef = Lateef({
    subsets: ["arabic"],
    weight: ["200", "300", "400", "500", "600", "700", "800"],
    variable: "--font-primary",
    display: "swap",
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

export async function generateMetadata(): Promise<Metadata> {
    const { store_name } = await store_identity();

    return {
        title: {
            default: "Luxury Watch Platform | Concept by Aymen Braikia",
            template: `%s | ${store_name}`,
        },
        description: "A full-stack luxury watch marketplace concept — consignment, spare parts, appointment booking, and multilingual storefront. Built by Aymen Braikia as a demonstration of production-grade e-commerce architecture.",
        applicationName: store_name,
        authors: [{ name: "Aymen Braikia" }],
        creator: "Aymen Braikia",
        publisher: "Aymen Braikia",

        metadataBase: new URL(BASE_URL),
        alternates: {
            canonical: "/en",
            languages: {
                en: "/en",
                de: "/de",
                tr: "/tr",
                fr: "/fr",
                it: "/it",
                es: "/es",
                ar: "/ar",
            },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },

        openGraph: {
            title: "Luxury Watch Platform Concept",
            description: "A full-stack e-commerce concept for the luxury watch trade — consignment, appointments, multilingual UX.",
            url: absolute_url("/en"),
            siteName: store_name,
            images: [
                {
                    url: "/banner.png",
                    width: 1200,
                    height: 630,
                    alt: "ORVELLA Platform Preview",
                },
            ],
            locale: "en",
            alternateLocale: ["de"],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: "Luxury Watch Platform Concept",
            description: "A full-stack e-commerce concept for the luxury watch trade.",
            images: ["/banner.png"],
        },
        icons: {
            icon: "/favicon.ico",
            apple: "/apple-touch-icon.png",
        },
        formatDetection: {
            telephone: false,
            email: false,
            address: false,
        },
        category: "ecommerce",
    };
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

                <NextIntlClientProvider>
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                        <Suspense fallback={<AuthShell session={undefined}>{children}</AuthShell>}>
                            <AuthGate>{children}</AuthGate>
                        </Suspense>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
