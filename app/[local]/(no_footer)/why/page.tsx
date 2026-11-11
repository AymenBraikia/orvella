import Dashboard from "./dashboard";
import Dealer from "./dealer";
import Gap from "./gap";
import GettingStarted from "./getting_started";
import Hero from "./hero";
import CTA from "./cta";
import { Floating_Cta } from "./floating_cta";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "../../(site)/lib/demo";
import type { Metadata } from "next";
import { site_metadata } from "../../(site)/lib/site_metadata";

// Pitch links (?ref=) are shared here, so the preview shows the dealer's name.
export async function generateMetadata({ params, searchParams }: PageProps<"/[local]/why">): Promise<Metadata> {
    return site_metadata((await params).local, (await searchParams).ref);
}

export default function Home() {
    // The dealer pitch only exists on the demo; a dealer's own shop has no /why page.
    if (!DEMO_MODE) notFound();

    return (
        <>
            <Hero />
            <hr className="w-dvw text-(--bg-secondary)" />
            <Gap />
            {/* <hr className="w-dvw text-(--bg-secondary)" />
            <Buyer /> */}
            <hr className="w-dvw text-(--bg-secondary)" />
            <Dealer />
            <Dashboard />
            {/* <hr className="w-dvw text-(--bg-secondary)" />
            <Role /> */}
            <hr className="w-dvw text-(--bg-secondary)" />
            <GettingStarted />
            <hr className="w-dvw text-(--bg-secondary)" />
            <CTA />
            <Floating_Cta />
        </>
    );
}
