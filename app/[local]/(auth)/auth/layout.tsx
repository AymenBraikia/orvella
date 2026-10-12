import type { Metadata } from "next";
import { Open_Sans, Cormorant_Garamond, Lateef, Tajawal } from "next/font/google";
import "../../globals.css";
import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getDirection } from "@/i18n/direction";

const tajawal = Tajawal({
    subsets: ["arabic"],
    weight: ["200", "300", "400", "500", "700","800","900"],
    variable: "--font-sans",
    display: "swap",
});
const lateef = Lateef({
    subsets: ["arabic"],
    weight: ["200", "300", "400", "500", "600", "700","800"],
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

export const metadata: Metadata = {
    title: {
        default: "ARVELL | High-End Luxury Watches & Expert Consultancy",
        template: "%s | ARVELL",
    },
    description: "Explore our curated collection of pristine pre-owned and new luxury watches, including Rolex, Patek Philippe, and Cartier. Book a professional consultation with our horology experts today.",
    keywords: ["luxury watches", "pre-owned Rolex", "Patek Philippe Calatrava", "Cartier Panthere", "Rolex Daytona", "buy luxury watches", "watch consultancy", "ARVELL"],
    authors: [{ name: "ARVELL" }],
    creator: "ARVELL",
    metadataBase: new URL("https://arvell.vercel.app/"),
    openGraph: {
        title: "ARVELL | High-End Luxury Watches & Expert Consultancy",
        description: "Our curated collection of pre-owned and new luxury watches is waiting for you. Partner with experts for your high-end horology needs.",
        url: "https://arvell.vercel.app/",
        siteName: "ARVELL",
        images: [
            {
                url: "/banner.png",
                width: 1200,
                height: 630,
                alt: "ARVELL Luxury Watch Collection",
            },
        ],
        locale: "en",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ARVELL | High-End Luxury Watches",
        description: "Your partner for high-end watches. Explore Rolex, Patek Philippe, Cartier, and book expert appointments.",
        images: ["/banner.png"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default async function AuthLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ local: string }>;
}>) {
        const { local } = await params;
    
        const direction = getDirection(local);
    
        const fonts_classes = direction == "ltr" ? `${openSans.variable} ${cormorantGaramond.variable}` : `${lateef.variable} ${tajawal.variable}`;
    
    return (
        <html lang={local} dir={direction} className={`${fonts_classes} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans">
                <NextIntlClientProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <div className="min-h-full flex-center flex-col max-w-dvw overflow-x-hidden p-4">{children}</div>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
