"use client";

import { useEffect, useRef, useState } from "react";

export default function FadeInObserver({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        let timeout: ReturnType<typeof setTimeout> | undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;

                observer.unobserve(element);

                if (delay > 0) {
                    timeout = setTimeout(() => {
                        setIsVisible(true);
                    }, delay);
                } else {
                    setIsVisible(true);
                }
            },
            {
                threshold: 0.15,
                rootMargin: "0px",
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();

            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [delay]);

    return (
        <div ref={elementRef} className={isVisible ? "fade-in w-full h-full flex-center flex-col" : "opacity-0 overflow-hidden"}>
            {children}
        </div>
    );
}
