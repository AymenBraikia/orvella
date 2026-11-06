import type { Metadata, Viewport } from "next";
import { Open_Sans, Gelasio, Cormorant_Garamond } from "next/font/google";
import StoreDocument from "@/app/components/store_document";
import { site_metadata } from "@/app/(site)/lib/site_metadata";
import { demo_metadata, enter_demo } from "@/app/server/storefront";

/*
 * Private lead demos: /<locale>/<demo>/… is the store's own pages (same layout, header, footer and
 * components) showing demos/<demo>.json — the seller's name, logo, hero, watches and Instagram — with
 * no cart or checkout. Not a demo address: the store's 404 (the pages call notFound()).
 */

// The store's fonts, with latin-ext so Turkish and other accented letters (ş, ğ, ı, İ…) use them too.
const openSans = Open_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"], variable: "--font-primary", display: "swap" });
const gelasio = Gelasio({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-secondary", display: "swap" });

export async function generateMetadata({ params }: LayoutProps<"/[local]/[demo]">): Promise<Metadata> {
    const demo = await enter_demo(params);
    return demo ? demo_metadata(demo) : site_metadata((await params).local);
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: "#000000",
    colorScheme: "dark light",
};

export default async function DemoLayout({ children, params }: LayoutProps<"/[local]/[demo]">) {
    const demo = await enter_demo(params);
    const { local } = await params;

    return (
        <StoreDocument local={local} fonts={`${openSans.variable} ${gelasio.variable} ${cormorantGaramond.variable}`} forced_theme={demo?.theme} accent={demo?.accent}>
            {children}
        </StoreDocument>
    );
}
