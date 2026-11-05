"use client";

import ImagesView from "@/app/components/images_view";
import { Item } from "@/types/item";
import { item_name } from "../../lib/item_name";

export default function Images_list({ data }: { data: Item }) {
    return <ImagesView images={data.images.map((url, index) => ({ src: url, alt: `${item_name(data)} — ${index + 1}` }))} />;
}
