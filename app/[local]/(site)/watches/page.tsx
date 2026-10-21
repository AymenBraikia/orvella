import Display_list from "@/app/components/display_list";
import get_items from "@/app/server/get_items";

export default async function WatchesPage() {
    const items = (await get_items()).filter((i) => i.type == "watch");

    return (
        <section className="w-full flex flex-col items-center justify-start gap-12 py-20 px-4 sm:px-8">
            <div className="w-full max-w-dvw flex flex-col gap-10">
                <Display_list items={items} />
            </div>
        </section>
    );
}
