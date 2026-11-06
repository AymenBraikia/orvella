import type { Metadata } from "next";
import BrandPage from "@/app/(site)/brand/[brand]/page";
import { brand_name } from "@/app/(site)/lib/brand_name";
import { notFound } from "next/navigation";
import { store_has } from "@/app/(site)/lib/storefront";
import { current_storefront, demo_metadata, require_demo } from "@/app/server/storefront";

/** A lead demo's brand page: the store's brand page with the demo's watches of that brand. */
export async function generateMetadata({ params }: PageProps<"/[local]/[demo]/brand/[brand]">): Promise<Metadata> {
    const { brand } = await params;
    const demo = await require_demo(params, `/brand/${brand}`);
    let name = brand;
    try {
        name = brand_name(decodeURIComponent(brand));
    } catch {
        // malformed address: keep it as it is
    }
    return demo_metadata(demo, { title: name, description: demo.description });
}

export default async function DemoBrand({ params }: PageProps<"/[local]/[demo]/brand/[brand]">) {
    const { brand } = await params;
    await require_demo(params, `/brand/${brand}`);
    // Only the brands the seller has.
    if (!store_has(current_storefront(), `/brand/${brand}`)) notFound();
    return <BrandPage params={params} />;
}
