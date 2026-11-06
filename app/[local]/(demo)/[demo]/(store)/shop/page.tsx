import type { Metadata } from "next";
import ShopPage from "@/app/(site)/shop/page";
import { demo_metadata, require_demo } from "@/app/server/storefront";

/** A lead demo's shop: the store's shop page (grid and filters) with the demo's watches. */
export async function generateMetadata({ params }: PageProps<"/[local]/[demo]/shop">): Promise<Metadata> {
    return demo_metadata(await require_demo(params, "/shop"));
}

export default async function DemoShop({ params }: PageProps<"/[local]/[demo]/shop">) {
    await require_demo(params, "/shop");
    return <ShopPage />;
}
