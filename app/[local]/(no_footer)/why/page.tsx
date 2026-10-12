import Buyer from "./buyer";
import Dealer from "./dealer";
import Gap from "./gap";
import GettingStarted from "./getting_started";
import Hero from "./hero";
import CTA from "./cta";
import Role from "./role";
import { Floating_Cta } from "./floating_cta";

export default function Home() {
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
