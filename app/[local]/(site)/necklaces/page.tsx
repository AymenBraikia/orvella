import { category_metadata } from "@/app/(site)/lib/site_metadata";
import Display_list from "@/app/components/display_list";
import get_items from "@/app/server/get_items";

export const generateMetadata = category_metadata("/necklaces", "common.necklaces", "seo.necklaces", "/necklaces.avif");

export default async function NecklacesPage() {
    const items = (await get_items()).filter((i) => i.type == "necklace");

    return (
        <section className="w-full flex flex-col items-center justify-start gap-12 py-20 px-4 sm:px-8">
            <div className="w-full max-w-dvw flex flex-col gap-10">
                <Display_list items={items} />
            </div>
        </section>
    );
}
