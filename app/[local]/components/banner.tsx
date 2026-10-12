import Image from "next/image";

export default function Banner({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative mt-5 h-65 w-full overflow-hidden sm:h-80">
            {/* Both are rendered; the .dark class on <html> is set before first paint,
                so CSS picks the right one with no hydration gap and no swap. */}
            <Image src="/shopBanner_white.png" alt="" fill sizes="100vw" loading="eager" className="object-cover object-center dark:hidden" />

            <Image src="/shopBanner.webp" alt="" fill sizes="100vw" loading="eager" className="object-cover object-center not-dark:hidden" />

            <div className="absolute inset-0 not-dark:hidden dark:bg-black/60" />

            <div className="relative z-10 flex h-full flex-col items-start justify-center gap-5 p-8 text-primary sm:p-12">{children}</div>
        </div>
    );
}
