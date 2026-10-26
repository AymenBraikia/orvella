import { site_metadata } from "@/app/(site)/lib/site_metadata";
import type { Metadata } from "next";
import { Open_Sans, Cormorant_Garamond, Lateef, Tajawal } from "next/font/google";
import "../../globals.css";
import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
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

export async function generateMetadata({ params }: { params: Promise<{ local: string }> }): Promise<Metadata> {
    return site_metadata((await params).local);
}

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
