import Watches_list from "@/app/components/watches_list";
import get_watches from "@/app/server/get_watches";

export default async function ShopPage() {
    const watches = await get_watches();

    return (
        <section className="w-full flex flex-col items-center justify-start gap-12 py-20 px-4 sm:px-8">
            <div className="w-full max-w-dvw flex flex-col gap-10">
                <Watches_list watches={watches} />
            </div>
        </section>
    );
}
