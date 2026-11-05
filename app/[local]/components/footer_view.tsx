import Link from "next/link";

/**
 * The footer layout: the store name with its details on the start side, link columns (`children`)
 * next to it and a bottom row.
 */
export default function FooterView({ name, home_href = "/", details, children, bottom }: { name: string; home_href?: string; details?: React.ReactNode; children?: React.ReactNode; bottom?: React.ReactNode }) {
    return (
        <footer className="w-full py-8 md:px-15 lg:px-20 px-4 flex-center flex-col bg-background font-bold z-30">
            <section className="w-full lg:h-75 lg:flex-row flex-col flex justify-between lg:items-center items-start">
                <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
                    <div className="max-w-full lg:max-w-xs">
                        <Link aria-label={"home"} href={home_href} className="block wrap-break-word text-gold font-primary uppercase text-3xl tracking-widest font-normal">
                            {name}
                        </Link>
                    </div>
                    {details}
                </div>
                {children}
            </section>
            <section className="w-full lg:gap-0 gap-4 flex-col lg:flex-row flex justify-between items-center font-normal text-xs lg:tracking-normal tracking-wider">{bottom}</section>
        </footer>
    );
}

/** One titled column of footer links. */
export function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-start items-start gap-4 my-5 lg:my-0 lg:h-full">
            <h5 className="lg:title5 title4 font-secondary text-gold">{heading}</h5>
            <ul className="flex flex-col justify-start items-start gap-2">{children}</ul>
        </div>
    );
}
