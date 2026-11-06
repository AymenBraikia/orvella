import { site_metadata } from "@/app/(site)/lib/site_metadata";
import type { Metadata, Viewport } from "next";
import { Open_Sans, Gelasio, Cormorant_Garamond, Tajawal, Lateef } from "next/font/google";
import { getDirection } from "@/i18n/direction";
import StoreDocument from "@/app/components/store_document";

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

    const fonts = getDirection(local) == "ltr" ? `${openSans.variable} ${gelasio.variable} ${cormorantGaramond.variable}` : `${lateef.variable} ${tajawal.variable}`;

    return (
        <StoreDocument local={local} fonts={fonts}>
            {children}
        </StoreDocument>
    );
}
