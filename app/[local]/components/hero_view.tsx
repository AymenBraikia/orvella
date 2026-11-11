import Image, { getImageProps } from "next/image";
import Link from "next/link";
import HeroVideo, { type VideoScreens } from "./hero_video";

/**
 * The full-screen hero: background photo (and optional video), dark overlay, title, subtitle and a
 * "Discover" link. With `desktop_image`, phones get `poster` and wider screens that photo (one
 * download each); `video_screens` says where the video plays.
 */
export default function HeroView({
    title,
    subtitle,
    discover,
    href = "#sections",
    poster,
    desktop_image,
    video,
    video_screens,
}: {
    title: string;
    subtitle: string;
    discover: string;
    href?: string;
    poster: string;
    desktop_image?: string;
    video?: string;
    video_screens?: VideoScreens;
}) {
    return (
        <section className="flex-col flex-center w-dvw h-dvh fixed top-0 inset-s-0 text-white">
            {desktop_image ? (
                <Background poster={poster} desktop_image={desktop_image} />
            ) : (
                <Image src={poster} alt="" aria-hidden="true" fill preload fetchPriority="high" sizes="100vw" quality={70} className="-z-30 object-cover" />
            )}
            {video && <HeroVideo src={video} poster={poster} screens={video_screens} />}
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

/** Art direction: `poster` on phones, `desktop_image` from md up. */
function Background({ poster, desktop_image }: { poster: string; desktop_image: string }) {
    const common = { alt: "", fill: true, sizes: "100vw", quality: 70 } as const;
    const {
        props: { srcSet: desktop },
    } = getImageProps({ ...common, src: desktop_image });
    const {
        props: { srcSet: mobile, ...rest },
    } = getImageProps({ ...common, src: poster, fetchPriority: "high", loading: "eager" });

    return (
        <picture>
            <source media="(min-width: 768px)" srcSet={desktop} />
            <source media="(max-width: 767px)" srcSet={mobile} />
            <img {...rest} alt="" aria-hidden="true" className="-z-30 object-cover" />
        </picture>
    );
}
