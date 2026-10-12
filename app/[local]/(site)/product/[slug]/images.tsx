"use client";

import { ZoomableImage } from "@/app/components/elements/zoomableImage";
import List from "@/app/components/scrollList";
import { Watch } from "@/types/watch";

export default function Images_list({ data }: { data: Watch }) {
    return (
        <List display={{ base: 1, sm: 1, md: 1, lg: 1 }}>
            {data.images.map((url, index) => (
                <div key={`${url}-${index}`} className="relative w-full h-full aspect-square sm:aspect-video lg:aspect-square">
                    <ZoomableImage src={url} alt={data.slug} />
                </div>
            ))}
        </List>
    );
}
