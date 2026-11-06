import Image from "next/image";
import { current_demo } from "@/app/server/storefront";

export default function Banner({ children }: { children: React.ReactNode }) {
    // A lead demo: two photos of the seller's (the store's own show a watch brand it may not carry).
    const own = current_demo()?.banner;
    const light = own?.light ?? "/shopBanner_white.png";
    const dark = own?.dark ?? "/shopBanner.webp";

    return (
        <div className="relative mt-5 h-65 w-full overflow-hidden sm:h-80">
            {/* Both are rendered; the .dark class on <html> is set before first paint,
                so CSS picks the right one with no hydration gap and no swap. */}
            <Image src={light} alt="" fill sizes="100vw" loading="eager" className="object-cover object-center dark:hidden" />

            <Image src={dark} alt="" fill sizes="100vw" loading="eager" className="object-cover object-center not-dark:hidden" />

            <div className="absolute inset-0 not-dark:hidden dark:bg-black/60" />
            {own && <div className="absolute inset-0 dark:hidden bg-white/60" />}

            <div className="relative z-10 flex h-full flex-col items-start justify-center gap-5 p-8 text-primary sm:p-12">{children}</div>
        </div>
    );
}
