import Link from "next/link";
import List from "./scrollList";
import FadeInObserver from "./fade_wrapper";

/** "New Arrivals": heading, text, a "view all" link and a carousel of product cards (the children). */
export default function NewView({ heading, subtext, link, children }: { heading: string; subtext: string; link: { href: string; label: string }; children: React.ReactNode }) {
    return (
        <section className="flex flex-col justify-center items-start sm:p-16 p-4 py-8 w-dvw gap-6 scroll-mt-20" id="new">
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver>
                    <h1 className={`text-5xl font-secondary tracking-wide sections text-gold`}>{heading}</h1>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col">
                <FadeInObserver delay={100}>
                    <p className="text-shine">{subtext}</p>
                </FadeInObserver>
            </div>
            <div className="w-fit flex justify-center items-start flex-col font-secondary">
                <FadeInObserver delay={200}>
                    <Link aria-label={link.label} href={link.href} className="underline text-xl text-gold" prefetch={true}>
                        {link.label}
                    </Link>
                </FadeInObserver>
            </div>

            <div className={`w-full sm-w-fit`}>
                <List display={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}>{children}</List>
            </div>
        </section>
    );
}
