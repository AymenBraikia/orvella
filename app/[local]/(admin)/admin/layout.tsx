import type { Metadata, Viewport } from "next";
import { Open_Sans, Gelasio, Cormorant_Garamond } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import "../../globals.css";

import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { get_admin } from "@/app/server/admin_auth";
import { get_settings } from "@/app/server/settings";
import Sidebar from "./_components/sidebar";
import Housekeeping from "./_components/housekeeping";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-primary", display: "swap" });
const gelasio = Gelasio({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-secondary", display: "swap" });

export const metadata: Metadata = {
    title: { default: "Admin", template: "%s | Admin" },
    robots: { index: false, follow: false },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    colorScheme: "dark light",
};

/** Admin is English-only and separate from the storefront chrome (no header/footer/cart). */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    // The proxy only checks the JWT; rights are re-checked against the database here and in every action.
    const admin = await get_admin();
    if (!admin) {
        const signed_in = Boolean((await cookies()).get("accessToken")?.value);
        redirect(signed_in ? "/" : "/auth/log_in?redirect=/admin");
    }

    const settings = await get_settings();

    return (
        <html lang="en" dir="ltr" className={`${openSans.variable} ${gelasio.variable} ${cormorantGaramond.variable} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans">
                <NextIntlClientProvider>
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                        <div className="min-h-dvh w-full flex flex-col lg:flex-row">
                            <Sidebar store_name={settings.store_name} admin_name={admin.name || admin.email} />
                            <main className="flex-1 min-w-0 flex flex-col gap-6 px-4 sm:px-8 py-6 sm:py-8">{children}</main>
                        </div>
                        <Housekeeping />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
