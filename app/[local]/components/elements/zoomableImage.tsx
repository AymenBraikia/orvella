import React, { useState, useRef } from "react";
import Image from "next/image";

interface ZoomableImageProps {
    src: string;
    alt: string;
    /** Rendered width, for the browser to pick the right image size. */
    sizes: string;
    /** Only the first image of a gallery should load eagerly. */
    priority?: boolean;
}

export function ZoomableImage({ src, alt, sizes, priority = false }: ZoomableImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("scale(1)");
    const [transformOrigin, setTransformOrigin] = useState("center center");

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        const box = container.getBoundingClientRect();

        const x = e.clientX - box.left;
        const y = e.clientY - box.top;

        const xPercent = (x / box.width) * 100;
        const yPercent = (y / box.height) * 100;

        setTransformOrigin(`${xPercent}% ${yPercent}%`);
        setTransform("scale(2.2)");
    };

    const handleMouseLeave = () => {
        setTransformOrigin("center center");
        setTransform("scale(1)");
    };

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative w-full h-full overflow-hidden cursor-crosshair">
            <div className="w-full h-full transition-transform duration-100 ease-out" style={{ transform, transformOrigin }}>
                <Image src={src} sizes={sizes} fill alt={alt} className="object-cover select-none" priority={priority} />
            </div>
        </div>
    );
}
