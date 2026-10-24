"use client";
import dynamic from "next/dynamic";
import NewCardLoader from "../loaders/newCard";
import { Item } from "@/app/(site)/lib/filters";

const Card = dynamic(() => import("../newCard"), {
    ssr: false,
    loading: () => <NewCardLoader />,
});

export default function NewCardWrapper({ data }: { data: Item }) {
    return <Card data={data} key={data.slug} />;
}
