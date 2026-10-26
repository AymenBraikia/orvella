"use client";

import { useSyncExternalStore } from "react";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Should the 2 MB background video play? Not on phones (likely mobile data), not with
 * "reduce motion" or Data Saver, not on slow connections. Everyone else gets it after hydration;
 * the poster image is shown until then (and instead of it).
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

    if (!play) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- full-bleed poster behind the hero, already a small optimised webp
            <img src={poster} alt="" aria-hidden="true" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover dark:brightness-50" />
        );
    }

    return (
        <video aria-hidden="true" autoPlay muted loop playsInline preload="auto" poster={poster} className="absolute inset-0 -z-10 size-full object-cover dark:brightness-50">
            <source src={src} type="video/mp4" />
        </video>
    );
}
