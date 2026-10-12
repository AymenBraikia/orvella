import { notFound } from "next/navigation";

import { watches_collection } from "@/app/db/collections";
import { Watch } from "@/types/watch";
import WatchForm from "../../components/watch_form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit watch" };

export default async function EditWatch({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const found = await (await watches_collection()).findOne({ slug }, { projection: { _id: 0 } });
    if (!found) notFound();

    const watch: Watch = JSON.parse(JSON.stringify(found));

    return (
        <>
            <header className="mb-8">
                <h1 className="text-2xl font-secondary">
                    {watch.brand} {watch.model}
                </h1>
                <p className="opacity-50 text-sm mt-1 font-mono">{watch.slug}</p>
            </header>

            <WatchForm watch={watch} />
        </>
    );
}
