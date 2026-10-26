import { category_metadata } from "@/app/(site)/lib/site_metadata";
import Display_list from "@/app/components/display_list";
import get_items from "@/app/server/get_items";

export const generateMetadata = category_metadata("/rings", "common.rings", "seo.rings", "/rings.webp");

export default async function RingsPage() {
    const items = (await get_items()).filter((i) => i.type == "ring");

    return (
        <section className="w-full flex flex-col items-center justify-start gap-12 py-20 px-4 sm:px-8">
            <div className="w-full max-w-dvw flex flex-col gap-10">
                <Display_list items={items} />
            </div>
        </section>
    );
}
