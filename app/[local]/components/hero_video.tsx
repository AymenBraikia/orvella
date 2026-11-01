"use client";

import { useSyncExternalStore } from "react";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Should the 2 MB background video play? Not on phones (likely mobile data), not with
 * "reduce motion" or Data Saver, not on slow connections. Everyone else gets it after hydration,
 * on top of the poster image the hero renders underneath.
 */
function wants_video(): boolean {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (!window.matchMedia("(min-width: 768px)").matches) return false;
    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")) return false;
    return true;
}

const subscribe = () => () => {};

export default function HeroVideo({ src, poster }: { src: string; poster: string }) {
    const play = useSyncExternalStore(subscribe, wants_video, () => false);

    if (!play) return null;

    return (
        <video aria-hidden="true" autoPlay muted loop playsInline preload="auto" poster={poster} className="absolute inset-0 -z-20 size-full object-cover">
            <source src={src} type="video/mp4" />
        </video>
    );
}
