import type { Metadata } from "next";
import { Open_Sans, Cormorant_Garamond, Tajawal, Lateef } from "next/font/google";

import "../../globals.css";

import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";

import { require_admin } from "@/app/server/admin/session";
import Sidebar from "./components/sidebar";
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


const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-primary", display: "swap" });

export const metadata: Metadata = {
    title: { default: "Admin", template: "%s | ARVELL Admin" },
    robots: { index: false, follow: false },
};


export default async function AdminLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ local: string }>;
}>) {    const { local } = await params;

    const direction = getDirection(local);

    const fonts_classes = direction == "ltr" ? `${openSans.variable} ${cormorantGaramond.variable}` : `${lateef.variable} ${tajawal.variable}`;

    // The real gate. proxy.ts only saves a round trip, it is not the security boundary.
    const session = await require_admin();

    return (
        <html lang={local} dir={direction} className={`${fonts_classes} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans">
                <NextIntlClientProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <div className="min-h-dvh flex flex-col md:flex-row">
                            <Sidebar name={session.name} />
                            <main className="flex-1 min-w-0 p-5 md:p-8">{children}</main>
                        </div>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
