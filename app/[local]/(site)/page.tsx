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
import { DEMO_MODE } from "./lib/demo";
import { JsonLd, store_jsonld } from "./lib/structured_data";
import { store_identity } from "@/app/server/store_identity";
import { getLocale } from "next-intl/server";

export default async function Home() {
    return (
        <div className="flex-col flex-center w-dvw">
            <JsonLd data={store_jsonld(await store_identity(), await getLocale())} />
            <Suspense fallback={<HeroLoader />}>
                <Hero />
            </Suspense>

            <div className="mt-[100dvh] flex-col flex-center w-dvw bg-background z-10">
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
            </div>
        </div>
    );
}
