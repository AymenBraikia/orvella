"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Next from "./svg/next";

interface Breakpoints {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
}

export default function List({ children, display }: { children: React.ReactNode; display: number | Breakpoints }) {
    const childrenArray = React.Children.toArray(children);
    const N = childrenArray.length;

    const [currentDisplay, setCurrentDisplay] = useState<number>(() => {
        if (typeof display === "number") return display;
        return display.base || 1;
    });

    const [isRTL, setIsRTL] = useState(false);

    useEffect(() => {
        const updateDirection = () => {
            const dir = document.documentElement.dir || "ltr";
            setIsRTL(dir === "rtl");
        };

        updateDirection();

        const observer = new MutationObserver(updateDirection);

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["dir"],
        });

        return () => observer.disconnect();
    }, []);

    const [gap, setGap] = useState(16);

    useLayoutEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            // display
            if (typeof display !== "number") {
                let computed = display.base || 1;

                if (width >= 1600 && display.xxl) computed = display.xxl;
                else if (width >= 1280 && display.xl) computed = display.xl;
                else if (width >= 1024 && display.lg) computed = display.lg;
                else if (width >= 768 && display.md) computed = display.md;
                else if (width >= 640 && display.sm) computed = display.sm;

                setCurrentDisplay(computed);
            }

            // gap
            if (width < 640) {
                setGap(0);
            } else if (width < 768) {
                setGap(12);
            } else {
                setGap(16);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [display]);

    const canLoop = N >= currentDisplay && N > 0;

    const [index, set_index] = useState(0);
    const [swipe, set_swipe] = useState(canLoop ? N : 0);
    const [isTransitioning, setIsTransitioning] = useState(true);

    const isAnimating = useRef(false);
    const prevDisplay = useRef(currentDisplay);

    useEffect(() => {
        if (prevDisplay.current !== currentDisplay) {
            set_swipe(canLoop ? index + N : index);
            prevDisplay.current = currentDisplay;
        }
    }, [currentDisplay, canLoop, N, index]);

    const extendedItems = canLoop ? [...childrenArray, ...childrenArray, ...childrenArray] : childrenArray;

    const handleNext = () => {
        if (!canLoop || isAnimating.current) return;

        setIsTransitioning(true);
        isAnimating.current = true;

        set_swipe((prev) => prev + 1);

        set_index((prev) => (prev + 1 !== N ? prev + 1 : 0));
    };

    const handlePrev = () => {
        if (!canLoop || isAnimating.current) return;

        setIsTransitioning(true);
        isAnimating.current = true;

        set_swipe((prev) => prev - 1);

        set_index((prev) => (prev - 1 !== -1 ? prev - 1 : N - 1));
    };

    const handleTransitionEnd = () => {
        if (!canLoop) return;

        isAnimating.current = false;

        if (swipe >= 2 * N) {
            setIsTransitioning(false);
            set_swipe(swipe - N);
        } else if (swipe <= N - 1) {
            setIsTransitioning(false);
            set_swipe(swipe + N);
        }
    };

    useEffect(() => {
        if (!isTransitioning) {
            let frame2: number;

            const frame1 = requestAnimationFrame(() => {
                frame2 = requestAnimationFrame(() => {
                    setIsTransitioning(true);
                });
            });

            return () => {
                cancelAnimationFrame(frame1);
                if (frame2) cancelAnimationFrame(frame2);
            };
        }
    }, [isTransitioning]);

    const direction = isRTL ? 1 : -1;

    const translateX = swipe * (100 / currentDisplay) * direction;

    const translateGap = ((swipe * gap) / currentDisplay) * direction;

    return (
        <div dir={isRTL ? "rtl" : "ltr"} className="relative w-full h-full overflow-hidden flex items-start justify-center flex-col sm:gap-4">
            <div
                onTransitionEnd={handleTransitionEnd}
                className={`flex w-full h-full ${isTransitioning ? "transition-transform duration-300 ease-in-out" : ""}`}
                style={{
                    gap: `${gap}px`,
                    transform: `translateX(calc(${translateX}% + ${translateGap}px))`,
                }}
            >
                {extendedItems.map((child, globalIndex) => (
                    <div
                        key={globalIndex}
                        className="shrink-0 min-w-0"
                        style={{
                            width: `calc(
                                ${100 / currentDisplay}%
                                - ${(gap * (currentDisplay - 1)) / currentDisplay}px
                            )`,
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 w-full mt-3 sm:mt-4 px-2">
                <button aria-label="Previous" type="button" className={`button2 flex-center p-2 sm:p-3 ${!canLoop ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} onClick={handlePrev} disabled={!canLoop}>
                    <Next
                        classnames="w-6 sm:w-8 lg:w-10"
                        clr="currentColor"
                        style={{
                            transform: `rotate(${isRTL ? 0 : 180}deg)`,
                        }}
                    />
                </button>

                <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">{gen_dot(N, index)}</div>

                <button aria-label="Next" type="button" className={`button2 flex-center p-2 sm:p-3 ${!canLoop ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} onClick={handleNext} disabled={!canLoop}>
                    <Next
                        classnames="w-6 sm:w-8 lg:w-10"
                        clr="currentColor"
                        style={{
                            transform: `rotate(${isRTL ? 180 : 0}deg)`,
                        }}
                    />
                </button>
            </div>
        </div>
    );
}

function gen_dot(n: number, index: number): React.ReactElement[] {
    return Array.from({ length: n }, (_, i) => <div key={i} className={`rounded-full transition-all duration-200 bg-foreground ${index === i ? "w-2 h-2 opacity-100 scale-100" : "w-1.5 h-1.5 opacity-40 scale-75"}`} />);
}
