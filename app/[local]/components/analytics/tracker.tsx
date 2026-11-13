"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";

const ENDPOINT = "/api/analytics/track";
const CHECKPOINT_INTERVAL = 15_000;

export default function AnalyticsTracker() {
    const params = useParams<{ name: string }>();
    const pathname = usePathname();

    const name = params.name;

    useEffect(() => {
        if (!name || !pathname) return;

        // One session per browser tab.
        let sessionId = sessionStorage.getItem("analytics_session_id");

        if (!sessionId) return;

        let active = document.visibilityState === "visible";
        let lastTick = performance.now();

        let elapsed = 0;
        let maxScrollY = window.scrollY;

        function accrueTime() {
            const now = performance.now();

            if (active) {
                elapsed += now - lastTick;
            }

            lastTick = now;
        }

        function send(useBeacon = false) {
            accrueTime();

            if (elapsed < 1000) return;

            const duration = Number((elapsed / 1000).toFixed(2));

            const payload = {
                name,
                sessionId,
                path: pathname,
                time_spent_seconds: duration,
                scroll_y: maxScrollY,
            };

            elapsed = 0;

            const body = JSON.stringify(payload);

            if (useBeacon) {
                const queued = navigator.sendBeacon(
                    ENDPOINT,
                    new Blob([body], {
                        type: "application/json",
                    }),
                );

                if (queued) return;
            }

            fetch(ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body,
                keepalive: useBeacon,
            }).catch(() => {});
        }

        function handleScroll() {
            maxScrollY = Math.max(maxScrollY, window.scrollY);
        }

        function handleVisibility() {
            if (document.visibilityState === "hidden") {
                send(true);
                active = false;
            } else {
                active = true;
                lastTick = performance.now();
            }
        }

        function handlePageHide() {
            send(true);
        }

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        document.addEventListener("visibilitychange", handleVisibility);

        window.addEventListener("pagehide", handlePageHide);

        const interval = setInterval(() => send(), CHECKPOINT_INTERVAL);

        return () => {
            clearInterval(interval);

            send(true);

            window.removeEventListener("scroll", handleScroll);

            document.removeEventListener("visibilitychange", handleVisibility);

            window.removeEventListener("pagehide", handlePageHide);
        };
    }, [name, pathname]);

    return null;
}
