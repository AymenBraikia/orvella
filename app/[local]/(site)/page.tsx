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

export default function Home() {
    return (
        <div className="flex-col flex-center w-dvw">
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
                    <Booking />
                </Suspense>
            </div>
        </div>
    );
}
