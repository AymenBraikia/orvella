import Image from "next/image";

/*
 * Plain CSS device frames for the storefront screenshots in public/why (captured from the demo at
 * 1440×900 and 390×844). Decorative: the surrounding copy says what they show.
 */

export function Laptop({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative w-full aspect-16/10 rounded-t-xl border-8 sm:border-10 border-neutral-800 bg-black overflow-hidden shadow-2xl">
                <Image src={src} alt={alt} fill sizes="(max-width: 768px) 90vw, 720px" className="object-cover object-top" />
            </div>
            <div className="w-[112%] h-2.5 sm:h-3.5 rounded-b-xl bg-linear-to-b from-neutral-600 to-neutral-800" />
        </div>
    );
}

export function Phone({ src, alt, className = "", children }: { src?: string; alt?: string; className?: string; children?: React.ReactNode }) {
    return (
        <div className={`relative aspect-390/844 rounded-[2.2rem] border-[7px] border-neutral-800 bg-black overflow-hidden shadow-2xl ${className}`}>
            <div aria-hidden="true" className="absolute top-2 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-1/4 h-4 rounded-full bg-neutral-800 z-10" />
            {src ? (
                // Screenshots have no status bar, so they start below the notch.
                <div className="absolute inset-x-0 bottom-0 top-6">
                    <Image src={src} alt={alt ?? ""} fill sizes="280px" className="object-cover object-top" />
                </div>
            ) : (
                children
            )}
        </div>
    );
}
