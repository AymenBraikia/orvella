"use client";
import Card from "../newCard";
import { Item } from "@/app/(site)/lib/filters";

/** Rendered on the server too, so new arrivals show (and count for LCP) without waiting for JS. */
export default function NewCardWrapper({ data }: { data: Item }) {
    return <Card data={data} key={data.slug} />;
}
