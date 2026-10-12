"use client";
import dynamic from "next/dynamic";
import NewCardLoader from "../loaders/newCard";
import { Watch } from "@/types/watch";

const Card = dynamic(() => import("../newCard"), {
    ssr: false,
    loading: () => <NewCardLoader />,
});

export default function NewCardWrapper({ data }: { data: Watch }) {
    return <Card data={data} key={data.slug} />;
}
