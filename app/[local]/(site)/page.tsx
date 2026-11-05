import { Suspense } from "react";
import Hero from "@/app/components/hero";
import New from "@/app/components/new";
import Inspired from "@/app/components/inspired";
import Iconic from "@/app/components/iconic";
import Booking from "@/app/components/booking";
import NewLoader from "../components/loaders/new";
import HeroLoader from "../components/loaders/hero";
import Sections from "../components/sections";
import Trade from "../components/trade";
import HomeLayout from "../components/home_layout";
import { DEMO_MODE } from "./lib/demo";
import { JsonLd, store_jsonld } from "./lib/structured_data";
import { shown_contact, store_identity } from "@/app/server/store_identity";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { site_metadata } from "./lib/site_metadata";

// Pitch links (?ref=) are shared here, so the preview shows the dealer's name.
export async function generateMetadata({ params, searchParams }: PageProps<"/[local]">): Promise<Metadata> {
    return site_metadata((await params).local, (await searchParams).ref);
}

async function jsonld_identity() {
    const identity = await store_identity();
    return { ...identity, ...shown_contact(identity) };
}

export default async function Home() {
    return (
        <HomeLayout
            before={<JsonLd data={store_jsonld(await jsonld_identity(), await getLocale())} />}
            hero={
                <Suspense fallback={<HeroLoader />}>
                    <Hero />
                </Suspense>
            }
        >
            <Suspense fallback={<></>}>
                <Sections />
            </Suspense>
            <Suspense fallback={<NewLoader />}>
                <New />
            </Suspense>
            <Suspense fallback={<></>}>
                <Inspired />
                <Iconic />
                <Trade />
                {/* <Services /> */}
                {/* The "Interested?" pitch to dealers belongs to the demo only */}
                {DEMO_MODE && <Booking />}
            </Suspense>
        </HomeLayout>
    );
}
