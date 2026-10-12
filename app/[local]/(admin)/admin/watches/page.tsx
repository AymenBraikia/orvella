import Link from "next/link";
import Image from "next/image";

import { format_price } from "@/app/(site)/lib/price_format";
import { get_admin_watches } from "@/app/server/admin/stats";
import WatchRowActions from "../components/watch_row_actions";
import { get_Currency } from "@/app/(site)/lib/get_currency";

export const dynamic = "force-dynamic";

export default async function AdminWatches({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams;
    const watches = await get_admin_watches(q);
    const country = await get_Currency();

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-secondary">Watches</h1>
                    <p className="opacity-50 text-sm mt-1">
                        {watches.length} {watches.length === 1 ? "piece" : "pieces"}
                        {q ? ` matching "${q}"` : ""}
                    </p>
                </div>

                <Link href="/admin/watches/new" className="px-5 py-2.5 bg-foreground text-background text-sm">
                    Add a watch
                </Link>
            </header>

            <form className="mb-6">
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search brand, model or reference"
                    className="w-full max-w-md outline-none text-base border-b border-(--foreground)/30 py-1 bg-transparent focus:border-foreground transition-colors duration-300"
                />
            </form>

            {watches.length === 0 ? (
                <p className="opacity-50 text-sm">Nothing here yet.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-(--foreground)/10">
                    {watches.map((watch) => (
                        <li key={watch.slug} className="flex items-center gap-4 py-3">
                            <div className="relative w-14 h-14 shrink-0 bg-secondary">{watch.images[0] && <Image src={watch.images[0]} alt="" fill sizes="56px" quality={60} className="object-cover" />}</div>

                            <div className="min-w-0 flex-1">
                                <Link href={`/admin/watches/${watch.slug}`} className="block truncate hover:underline">
                                    {watch.brand} {watch.model}
                                </Link>
                                <p className="text-xs opacity-50 truncate">
                                    ref. {watch.reference} · {watch.year} · {watch.condition}
                                </p>
                            </div>

                            <p className="text-sm whitespace-nowrap hidden sm:block">{format_price(watch.price, country)}</p>

                            <WatchRowActions slug={watch.slug} inStock={watch.inStock} featured={watch.featured} />
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
