import Image from "next/image";
import Link from "next/link";
import HeroVideo from "./hero_video";

/**
 * The full-screen hero: background photo (and optional video), dark overlay, title, subtitle and a
 * "Discover" link.
 */
export default function HeroView({ title, subtitle, discover, href = "#sections", poster, video }: { title: string; subtitle: string; discover: string; href?: string; poster: string; video?: string }) {
    return (
        <section className="flex-col flex-center w-dvw h-dvh fixed top-0 inset-s-0 text-white">
            <Image src={poster} alt="" aria-hidden="true" fill preload fetchPriority="high" sizes="100vw" quality={70} className="-z-30 object-cover" />
            {video && <HeroVideo src={video} poster={poster} />}
            {/* Keeps the headline readable over the bright parts of the photo and video. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-radial from-black/30 to-black/75" />

            <div className="flex-center flex-col font-primary gap-2 text-center px-4">
                <h1 className="tracking-widest font-light! text-gold text-6xl">{title}</h1>

                <h2 className="sm:title5 title4 tracking-wider dark:text-shine text-(--bg-secondary) italic font-secondary">{subtitle}</h2>

                <Link href={href} aria-label={discover} className="underline text-gold tracking-wider title4">
                    {discover}
                </Link>
            </div>
        </section>
    );
}
