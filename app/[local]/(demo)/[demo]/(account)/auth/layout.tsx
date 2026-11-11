import type { Metadata } from "next";
import { Open_Sans, Cormorant_Garamond } from "next/font/google";
import AuthDocument from "@/app/components/auth_document";
import { site_metadata } from "@/app/(site)/lib/site_metadata";
import { current_storefront, demo_metadata, enter_demo } from "@/app/server/storefront";

/** A lead demo's sign-in / sign-up pages: the store's own, with links that stay in the demo. */

// The store's fonts, with latin-ext for Turkish and other accented letters.
const openSans = Open_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"], variable: "--font-primary", display: "swap" });

export async function generateMetadata({ params }: LayoutProps<"/[local]/[demo]/auth">): Promise<Metadata> {
    const demo = await enter_demo(params);
    return demo ? demo_metadata(demo) : site_metadata((await params).local);
}

export default async function DemoAuthLayout({ children, params }: LayoutProps<"/[local]/[demo]/auth">) {
    await enter_demo(params);
    const { local } = await params;
    return (
        <AuthDocument local={local} fonts={`${openSans.variable} ${cormorantGaramond.variable}`} store={current_storefront()}>
            {children}
        </AuthDocument>
    );
}
