"use client";

import { useCallback, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { product_schema, product_title, slugify, SPARE_CATEGORIES, type ProductInput, type ProductType } from "../schema";
import { save_product } from "../../actions/products";
import MediaManager from "./media_manager";
import { ITEM_TYPE_LABEL } from "../../_lib/labels";
import { empty_product } from "../defaults";

type State = Record<string, unknown>;

const OPTIONAL_NUMBERS = ["fineness", "karats", "band_width"];

/** Empty optional number inputs mean "not set", not 0. */
function clean(state: State): State {
    const out = { ...state };
    for (const key of OPTIONAL_NUMBERS) if (out[key] === "" || out[key] === null) delete out[key];
    return out;
}

export default function ProductForm({ initial, original_slug }: { initial: State; original_slug?: string }) {
    const router = useRouter();
    const [state, set_state] = useState<State>(initial);
    const [errors, set_errors] = useState<Record<string, string>>({});
    const [message, set_message] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
    const [slug_touched, set_slug_touched] = useState(Boolean(original_slug));
    const [uploading, set_uploading] = useState(false);
    const [saving, start] = useTransition();

    const type = state.type as ProductType;
    const is_watch_like = type == "watch" || type == "spare";

    const set = (key: string, value: unknown) => set_state((s) => ({ ...s, [key]: value }));
    const auto_slug = slugify(product_title(state as Partial<ProductInput>));

    const on_media = useCallback((images: string[], video: string) => set_state((s) => ({ ...s, images, video })), []);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (uploading) return set_message({ tone: "error", text: "Wait until all uploads have finished." });

        const payload = clean({ ...state, slug: slug_touched ? state.slug : "" });
        const parsed = product_schema.safeParse(payload);
        if (!parsed.success) {
            const next: Record<string, string> = {};
            for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
            set_errors(next);
            return set_message({ tone: "error", text: "Please fix the highlighted fields." });
        }

        set_errors({});
        set_message(null);
        start(async () => {
            const result = await save_product(payload, original_slug);
            if (!result.ok) {
                set_errors(result.fields ?? {});
                set_message({ tone: "error", text: result.error });
                return;
            }
            set_message({ tone: "ok", text: "Saved. The storefront is updated." });
            if (result.slug !== original_slug) router.replace(`/admin/products/${result.slug}`);
            router.refresh();
        });
    }

    const field = (key: string) => ({ value: (state[key] ?? "") as string | number, error: errors[key], onChange: (v: string) => set(key, v) });

    return (
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
            {!original_slug && (
                <Section title="Type">
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(ITEM_TYPE_LABEL) as ProductType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => set_state({ ...empty_product(t), images: state.images, video: state.video, price: state.price, description: state.description })}
                                className={`px-4 py-2 text-sm border ${t == type ? "border-gold text-gold" : "border-secondary/40 text-secondary"}`}
                            >
                                {ITEM_TYPE_LABEL[t]}
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            <Section title="Basics">
                <div className="grid sm:grid-cols-2 gap-4">
                    {is_watch_like ? (
                        <>
                            <Text label="Brand *" {...field("brand")} placeholder="Rolex" />
                            <Text label="Model *" {...field("model")} placeholder="Datejust 36" />
                            <Text label="Reference" {...field("reference")} placeholder="126233" />
                            {type == "spare" && <Text label="Part name *" {...field("partName")} placeholder="White dial" />}
                        </>
                    ) : (
                        <Text label="Name *" {...field("display_name")} placeholder="18K gold signet ring" />
                    )}
                    <Text
                        label="URL slug"
                        value={(slug_touched ? state.slug : auto_slug) as string}
                        error={errors.slug}
                        onChange={(v) => {
                            set_slug_touched(true);
                            set("slug", slugify(v));
                        }}
                        hint={slug_touched ? "Leave empty to generate it from the name." : "Generated from the name — edit to customise."}
                    />
                </div>
            </Section>

            <Section title="Price & stock">
                <div className="grid sm:grid-cols-3 gap-4">
                    <Text label="Price (EUR) *" type="number" {...field("price")} hint="Gross price shown in the shop." />
                    <Select label="Condition" {...field("condition")} options={["Pre-Owned", "New"]} />
                    <Select label="For" {...field("gender")} options={["Men", "Women"]} />
                    {type == "spare" ? (
                        <Text label="Quantity in stock" type="number" {...field("quantity")} />
                    ) : (
                        <p className="text-xs text-secondary self-end">One-of-one piece: sold / reserved / available is set from the product list.</p>
                    )}
                    <Text label="Preview tag (?ref=)" {...field("preview")} hint="Optional. Only visitors with this ?ref= see the piece." />
                    <Toggle label="Featured" checked={Boolean(state.featured)} onChange={(v) => set("featured", v)} />
                </div>
            </Section>

            <Section title="Details">
                {is_watch_like ? <WatchDetails state={state} set={set} field={field} type={type} /> : <JewelryDetails state={state} set={set} field={field} type={type} />}
            </Section>

            <Section title="Description">
                <label className="flex flex-col gap-1 text-xs text-secondary">
                    Shown on the product page and cards
                    <textarea value={(state.description as string) ?? ""} onChange={(e) => set("description", e.target.value)} rows={6} className="border border-secondary/40 bg-transparent p-2 text-sm text-foreground outline-none focus:border-gold" />
                </label>
            </Section>

            <Section title="Photos & video">
                <MediaManager images={(state.images as string[]) ?? []} video={(state.video as string) ?? ""} onChange={on_media} onBusy={set_uploading} />
                {errors.images && <p className="text-sm text-red-400">{errors.images}</p>}
            </Section>

            <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 bg-background border-t border-secondary/30 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                <button type="submit" disabled={saving || uploading} className={`button3 bg-gold text-primary px-6! py-3! ${saving || uploading ? "disabled" : ""}`}>
                    {saving ? "Saving…" : original_slug ? "Save changes" : "Create product"}
                </button>
                <Link href="/admin/products" className="button2 px-4! py-2!">
                    Back to list
                </Link>
                {original_slug && (
                    <Link href={`/product/${original_slug}`} target="_blank" className="text-sm underline text-secondary">
                        View in shop ↗
                    </Link>
                )}
                {message && (
                    <p role={message.tone == "error" ? "alert" : "status"} className={`text-sm ${message.tone == "error" ? "text-red-400" : "text-emerald-500"}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </form>
    );
}

type FieldProps = { value: string | number; error?: string; onChange: (v: string) => void };
type DetailsProps = { state: State; set: (k: string, v: unknown) => void; field: (k: string) => FieldProps; type: ProductType };

function WatchDetails({ state, set, field, type }: DetailsProps) {
    const box = (state.boxPapers ?? {}) as Record<string, boolean>;
    return (
        <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-3 gap-4">
                <Text label="Year" type="number" {...field("year")} hint="0 if unknown" />
                <Select label="Movement" {...field("movement")} options={["Automatic", "Manual", "Quartz"]} />
                <Text label="Case diameter (mm)" type="number" {...field("caseDiameterMm")} />
                <Text label="Case material" {...field("caseMaterial")} />
                <Text label="Bracelet material" {...field("braceletMaterial")} />
                <Text label="Dial colour" {...field("dialColor")} />
                <Text label="Water resistance (m)" type="number" {...field("waterResistanceM")} />
            </div>
            <div className="flex flex-wrap gap-6">
                {(["box", "papers", "firstInvoice", "serviceInvoice"] as const).map((k) => (
                    <Toggle key={k} label={{ box: "Box", papers: "Papers", firstInvoice: "First invoice", serviceInvoice: "Service invoice" }[k]} checked={Boolean(box[k])} onChange={(v) => set("boxPapers", { ...box, [k]: v })} />
                ))}
            </div>
            {type == "spare" && (
                <div className="grid sm:grid-cols-3 gap-4">
                    <Select label="Category" {...field("spareCategory")} options={[...SPARE_CATEGORIES]} />
                    <ListText label="Compatible references" value={state.compatibleModels as string[]} onChange={(v) => set("compatibleModels", v)} />
                    <ListText label="Tags" value={state.tags as string[]} onChange={(v) => set("tags", v)} />
                </div>
            )}
        </div>
    );
}

function JewelryDetails({ state, set, field, type }: DetailsProps) {
    return (
        <div className="grid sm:grid-cols-3 gap-4">
            <Select label="Metal" {...field("metal_type")} options={["Gold", "White Gold", "Silver", "Platinum"]} />
            <Text label="Karats" type="number" {...field("karats")} hint="e.g. 18 (gold)" />
            <Text label="Fineness" type="number" {...field("fineness")} hint="e.g. 750 or 925" />
            <Text label="Weight" type="number" {...field("weight")} />
            <Select label="Weight unit" {...field("measurement_unit")} options={["grams", "ounces"]} />
            <ListText label="Stones" value={state.stones as string[]} onChange={(v) => set("stones", v)} />
            {type == "ring" ? (
                <>
                    <Text label="Ring size *" {...field("ring_size")} />
                    <Text label="Band width (mm)" type="number" {...field("band_width")} />
                </>
            ) : (
                <>
                    <Text label="Length" type="number" {...field("length")} />
                    <Select label="Length unit" {...field("length_unit")} options={["cm", "inches"]} />
                    <Text label="Clasp" {...field("clasp_type")} />
                </>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <fieldset className="flex flex-col gap-4 border border-secondary/30 p-4">
            <legend className="px-2 font-secondary text-gold">{title}</legend>
            {children}
        </fieldset>
    );
}

function Text({ label, value, onChange, error, hint, type = "text", placeholder }: FieldProps & { label: string; hint?: string; type?: "text" | "number"; placeholder?: string }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <input
                type={type}
                inputMode={type == "number" ? "decimal" : undefined}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`border-b bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold ${error ? "border-red-400" : "border-secondary"}`}
            />
            {error ? <span className="text-red-400">{error}</span> : hint ? <span>{hint}</span> : null}
        </label>
    );
}

function Select({ label, value, onChange, error, options }: FieldProps & { label: string; options: string[] }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} className="border-b border-secondary bg-background py-1 text-sm text-foreground outline-none focus:border-gold">
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
            {error && <span className="text-red-400">{error}</span>}
        </label>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 text-sm cursor-pointer self-end py-1">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-(--clr-gold) w-4 h-4" />
            {label}
        </label>
    );
}

/** Comma-separated input for string lists (stones, tags, compatible references). */
function ListText({ label, value, onChange }: { label: string; value?: string[]; onChange: (v: string[]) => void }) {
    const [draft, set_draft] = useState((value ?? []).join(", "));
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <input
                value={draft}
                onChange={(e) => {
                    set_draft(e.target.value);
                    onChange(
                        e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                    );
                }}
                className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold"
            />
            <span>Separate with commas</span>
        </label>
    );
}
