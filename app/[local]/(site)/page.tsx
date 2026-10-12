import { Suspense } from "react";
import Hero from "@/app/components/hero";
import New from "@/app/components/new";
import Inspired from "@/app/components/inspired";
import Iconic from "@/app/components/iconic";
import Services from "@/app/components/services";
import Booking from "@/app/components/booking";
import NewLoader from "../components/loaders/new";
import HeroLoader from "../components/loaders/hero";

export default function Home() {
    return (
        <div className="flex-col flex-center w-full">
            <Suspense fallback={<HeroLoader />}>
                <Hero />
            </Suspense>

            <div className="mt-[100dvh] flex-col flex-center w-full bg-background z-10">
                <Suspense fallback={<NewLoader />}>
                    <New />
                </Suspense>
                <Suspense fallback={<></>}>
                    <Inspired />
                    <Iconic />
                    <Services />
                    <Booking />
                </Suspense>
            </div>
        </div>
    );
}
