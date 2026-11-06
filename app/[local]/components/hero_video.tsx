"use client";

import { useSyncExternalStore } from "react";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Where the video plays. The store's own hero: from md up only (phones are likely on mobile data). */
export type VideoScreens = "desktop" | "mobile";

/**
 * Should the 2 MB background video play? Only on its screens, not with "reduce motion" or Data
 * Saver, not on slow connections. Everyone else gets it after hydration, on top of the poster image
 * the hero renders underneath.
 */
function wants_video(screens: VideoScreens): boolean {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(min-width: 768px)").matches != (screens == "desktop")) return false;
    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")) return false;
    return true;
}

const subscribe = () => () => {};

export default function HeroVideo({ src, poster, screens = "desktop" }: { src: string; poster: string; screens?: VideoScreens }) {
    const play = useSyncExternalStore(subscribe, () => wants_video(screens), () => false);

    if (!play) return null;

    return (
        <video aria-hidden="true" autoPlay muted loop playsInline preload="auto" poster={poster} className="absolute inset-0 -z-20 size-full object-cover">
            <source src={src} type="video/mp4" />
        </video>
    );
}
