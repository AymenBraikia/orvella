"use client";

import { ZoomableImage } from "@/app/components/elements/zoomableImage";
import List from "@/app/components/scrollList";
import { Item } from "@/types/item";
import { item_name } from "../../lib/item_name";

export default function Images_list({ data }: { data: Item }) {
    return (
        <List display={{ base: 1, sm: 1, md: 1, lg: 1 }}>
            {data.images.map((url, index) => (
                <div key={`${url}-${index}`} className="relative w-full h-full aspect-square sm:aspect-video lg:aspect-square">
                    <ZoomableImage src={url} alt={`${item_name(data)} — ${index + 1}`} sizes="(max-width: 1024px) 100vw, 40vw" priority={index == 0} />
                </div>
            ))}
        </List>
    );
}
