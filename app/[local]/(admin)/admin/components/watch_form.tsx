"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Watch } from "@/types/watch";
import { save_watch, type ActionResult } from "@/app/server/admin/watch_actions";

const field = "w-full outline-none text-base border-b border-(--foreground)/30 py-1 bg-transparent focus:border-(--foreground) transition-colors duration-300";

function Text({ label, name, defaultValue, required, type = "text", placeholder }: { label: string; name: string; defaultValue?: string | number; required?: boolean; type?: string; placeholder?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.12em] opacity-50">
                {label}
                {required && "*"}
            </span>
            <input className={field} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} step={type === "number" ? "any" : undefined} />
        </label>
    );
}

function Select({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.12em] opacity-50">{label}</span>
            <select className={field} name={name} defaultValue={defaultValue}>
                {options.map((option) => (
                    <option key={option} value={option} className="bg-background">
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
    return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-[var(--foreground)]" />
            {label}
        </label>
    );
}

export default function WatchForm({ watch }: { watch?: Watch }) {
    const router = useRouter();
    const [state, action, pending] = useActionState<ActionResult | null, FormData>(save_watch, null);

    useEffect(() => {
        if (state?.success) router.push("/admin/watches");
    }, [state, router]);

    return (
        <form action={action} className="max-w-3xl">
            {watch && <input type="hidden" name="originalSlug" value={watch.slug} />}
            {watch && <input type="hidden" name="slug" value={watch.slug} />}

            <fieldset className="grid sm:grid-cols-2 gap-5 mb-8" disabled={pending}>
                <Text label="Brand" name="brand" defaultValue={watch?.brand} required placeholder="Rolex" />
                <Text label="Model" name="model" defaultValue={watch?.model} required placeholder="Submariner Date" />
                <Text label="Reference" name="reference" defaultValue={watch?.reference} required placeholder="126610LN" />
                <Text label="Year" name="year" type="number" defaultValue={watch?.year} required placeholder="2021" />
                <Text label="Price (EUR)" name="price" type="number" defaultValue={watch?.price} required placeholder="12990" />
                <Select label="Condition" name="condition" options={["Pre-Owned", "New"]} defaultValue={watch?.condition} />
                <Select label="Movement" name="movement" options={["Automatic", "Manual", "Quartz"]} defaultValue={watch?.movement} />
                <Select label="Gender" name="gender" options={["Men", "Women"]} defaultValue={watch?.gender} />
                <Text label="Case material" name="caseMaterial" defaultValue={watch?.caseMaterial} placeholder="Stainless Steel" />
                <Text label="Bracelet material" name="braceletMaterial" defaultValue={watch?.braceletMaterial} placeholder="Stainless Steel" />
                <Text label="Dial colour" name="dialColor" defaultValue={watch?.dialColor} placeholder="Black" />
                <Text label="Case diameter (mm)" name="caseDiameterMm" type="number" defaultValue={watch?.caseDiameterMm} placeholder="41" />
                <Text label="Water resistance (m)" name="waterResistanceM" type="number" defaultValue={watch?.waterResistanceM} placeholder="300" />
            </fieldset>

            <fieldset className="mb-8" disabled={pending}>
                <p className="text-xs uppercase tracking-[0.12em] opacity-50 mb-3">Delivered with</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <Check label="Box" name="box" defaultChecked={watch?.boxPapers.box} />
                    <Check label="Papers" name="papers" defaultChecked={watch?.boxPapers.papers} />
                    <Check label="First invoice" name="firstInvoice" defaultChecked={watch?.boxPapers.firstInvoice} />
                    <Check label="Service invoice" name="serviceInvoice" defaultChecked={watch?.boxPapers.serviceInvoice} />
                </div>
            </fieldset>

            <fieldset className="flex flex-col gap-5 mb-8" disabled={pending}>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-[0.12em] opacity-50">Images, one per line*</span>
                    <textarea className={`${field} min-h-28 font-mono text-sm`} name="images" defaultValue={watch?.images.join("\n")} required placeholder={"/uploads/Rolex/.../img_0.png\nhttps://..."} />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-[0.12em] opacity-50">Description</span>
                    <textarea className={`${field} min-h-24`} name="description" defaultValue={watch?.description} />
                </label>

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <Check label="In stock" name="inStock" defaultChecked={watch ? watch.inStock : true} />
                    <Check label="Featured on the homepage" name="featured" defaultChecked={watch?.featured} />
                </div>
            </fieldset>

            {state?.error && <p className="mb-4 text-sm text-red-500">{state.error}</p>}

            <div className="flex items-center gap-4">
                <button type="submit" disabled={pending} className="px-6 py-2.5 bg-[var(--foreground)] text-background text-sm disabled:opacity-40 transition-opacity duration-300">
                    {pending ? "Saving..." : watch ? "Save changes" : "Add watch"}
                </button>
                <Link href="/admin/watches" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                    Cancel
                </Link>
            </div>
        </form>
    );
}
