import Buyer from "./buyer";
import Dealer from "./dealer";
import Gap from "./gap";
import GettingStarted from "./getting_started";
import Hero from "./hero";
import CTA from "./cta";
import Role from "./role";
import { Floating_Cta } from "./floating_cta";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "../../(site)/lib/demo";

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
