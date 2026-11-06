import type { Metadata } from "next";
import Home from "@/app/(site)/page";
import { demo_metadata, require_demo } from "@/app/server/storefront";

/** A lead demo's home page: the store's home page, with the demo's hero and watches. */
export async function generateMetadata({ params }: PageProps<"/[local]/[demo]">): Promise<Metadata> {
    return demo_metadata(await require_demo(params, ""));
}

export default async function DemoHome({ params }: PageProps<"/[local]/[demo]">) {
    await require_demo(params, "");
    return <Home />;
}
