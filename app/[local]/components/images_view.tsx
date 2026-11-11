"use client";

import { ZoomableImage } from "./elements/zoomableImage";
import List from "./scrollList";

/** The product page's photo carousel: one zoomable photo at a time. */
export default function ImagesView({ images }: { images: { src: string; alt: string }[] }) {
    return (
        <List display={{ base: 1, sm: 1, md: 1, lg: 1 }}>
            {images.map(({ src, alt }, index) => (
                <div key={`${src}-${index}`} className="relative w-full h-full aspect-square sm:aspect-video lg:aspect-square">
                    <ZoomableImage src={src} alt={alt} sizes="(max-width: 1024px) 100vw, 40vw" priority={index == 0} />
                </div>
            ))}
        </List>
    );
}
