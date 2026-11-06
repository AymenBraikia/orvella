import type { Metadata } from "next";
import ProductPage from "@/app/(site)/product/[slug]/page";
import { item_name } from "@/app/(site)/lib/item_name";
import get_product from "@/app/(site)/product/[slug]/get_product";
import { demo_metadata, require_demo } from "@/app/server/storefront";

/** A lead demo's product page: the store's product page for one of the demo's watches. */
export async function generateMetadata({ params }: PageProps<"/[local]/[demo]/product/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const demo = await require_demo(params, `/product/${slug}`);
    const item = await get_product(slug);
    return demo_metadata(demo, item ? { title: item_name(item), description: item.description, image: item.images[0] } : undefined);
}

export default async function DemoProduct({ params }: PageProps<"/[local]/[demo]/product/[slug]">) {
    const { slug } = await params;
    await require_demo(params, `/product/${slug}`);
    return <ProductPage params={params} />;
}
