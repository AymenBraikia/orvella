"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { save_private_demo } from "../../actions/private_demos";
import { demo_schema } from "../schema";
import { demo_photo_url } from "@/app/(site)/lib/private_demo";
import { DEMO_CURRENCIES, MAX_DEMO_PIECES, MAX_PIECE_PHOTOS, type DemoCategory, type DemoLanguage, type DemoCurrency, type DemoPieceDetails, type DemoPieceKind, type PrivateDemoInput } from "@/types/private_demo";

/** Details as typed in the form; numbers and lists are converted on save (see details_payload). */
type DetailsState = Partial<Record<keyof DemoPieceDetails, string>>;
type PieceState = { id: string; title: string; price: string; description: string; photos: string[]; kind: DemoPieceKind | ""; brand: string; details: DetailsState };

const NUMBER_DETAILS = ["year", "caseDiameterMm", "waterResistanceM", "karats", "weight_g", "length_cm"] as const;

function details_state(details: DemoPieceDetails | undefined): DetailsState {
    return Object.fromEntries(Object.entries(details ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v)]));
}

/** Form text → the stored details: empty is "not known", numbers become numbers (or NaN, which the schema rejects), stones a list. */
function details_payload(details: DetailsState): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(details)) {
        const value = raw?.trim();
        if (!value) continue;
        if ((NUMBER_DETAILS as readonly string[]).includes(key)) out[key] = Number(value.replace(",", "."));
        else if (key == "stones") out[key] = value.split(",").map((stone) => stone.trim()).filter(Boolean);
        else out[key] = value;
    }
    return out;
}
type Values = { slug: string; name: string; instagram: string; category: DemoCategory; language: DemoLanguage; currency: DemoCurrency };

/** Longest side of an uploaded photo: sharp on a retina phone, small enough to store in the database. */
const MAX_SIDE = 1600;

const new_piece = (): PieceState => ({ id: crypto.randomUUID().slice(0, 8), title: "", price: "", description: "", photos: [], kind: "", brand: "", details: {} });

/** "12 500", "12,500", "12.500,50" → number; "" → undefined; anything else → NaN (rejected by the schema). */
function parse_price(raw: string): number | undefined {
    let s = raw.replace(/[\s'’€$£]/g, "");
    if (!s) return undefined;
    if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (/,\d{3}$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
    return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Resize in the browser to a JPEG of at most MAX_SIDE px, so uploads stay small and fast. */
async function prepare_photo(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [0.85, 0.72, 0.6]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size < 2.4 * 1024 * 1024) return blob;
    }
    throw new Error("Photo too large");
}

async function upload_photo(demo_id: string, file: File): Promise<string> {
    const form = new FormData();
    form.append("demo_id", demo_id);
    form.append("file", await prepare_photo(file), "photo.jpg");
    const response = await fetch("/api/demo-photos", { method: "POST", body: form });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.id) throw new Error(json.error || `Upload failed (${response.status})`);
    return json.id;
}

export default function DemoForm({ id, initial, is_new }: { id: string; initial: PrivateDemoInput | null; is_new: boolean }) {
    const router = useRouter();
    const [values, set_values] = useState<Values>({
        slug: initial?.slug ?? "",
        name: initial?.name ?? "",
        instagram: initial?.instagram ?? "",
        category: initial?.category ?? "watches",
        language: initial?.language ?? "en",
        currency: initial?.currency ?? "EUR",
    });
    const [pieces, set_pieces] = useState<PieceState[]>(initial?.pieces.map((p) => ({ ...p, price: String(p.price), kind: p.kind ?? "", brand: p.brand ?? "", details: details_state(p.details) })) ?? [new_piece()]);
    const [uploading, set_uploading] = useState<Record<string, number>>({});
    const [errors, set_errors] = useState<Record<string, string>>({});
    const [message, set_message] = useState<{ ok: boolean; text: string } | null>(null);
    const [saving, start] = useTransition();

    const set = (key: keyof Values) => (value: string) => set_values((v) => ({ ...v, [key]: value }));
    const update_piece = (index: number, change: Partial<PieceState>) => set_pieces((list) => list.map((p, i) => (i == index ? { ...p, ...change } : p)));
    const move_piece = (index: number, by: number) =>
        set_pieces((list) => {
            const next = [...list];
            const [piece] = next.splice(index, 1);
            next.splice(Math.max(0, Math.min(next.length, index + by)), 0, piece);
            return next;
        });

    async function add_photos(piece_id: string, files: FileList | null) {
        if (!files?.length) return;
        const room = MAX_PIECE_PHOTOS - (pieces.find((p) => p.id == piece_id)?.photos.length ?? 0);
        const chosen = Array.from(files).slice(0, Math.max(0, room));
        set_uploading((u) => ({ ...u, [piece_id]: (u[piece_id] ?? 0) + chosen.length }));
        set_message(null);

        for (const file of chosen) {
            try {
                const photo = await upload_photo(id, file);
                set_pieces((list) => list.map((p) => (p.id == piece_id ? { ...p, photos: [...p.photos, photo] } : p)));
            } catch (error) {
                // createImageBitmap throws a DOMException for formats the browser cannot decode (e.g. HEIC outside Safari).
                const unreadable = error instanceof DOMException || (error as Error).message == "Photo too large";
                set_message({ ok: false, text: `${file.name}: ${unreadable ? "could not be read. Use a JPG, PNG or WebP photo." : (error as Error).message}` });
            } finally {
                set_uploading((u) => ({ ...u, [piece_id]: (u[piece_id] ?? 1) - 1 }));
            }
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (Object.values(uploading).some((n) => n > 0)) return set_message({ ok: false, text: "Wait for the photos to finish uploading." });

        const payload = {
            ...values,
            instagram: values.instagram,
            pieces: pieces.map((p) => {
                const kind = values.category == "watches" ? "watch" : p.kind || undefined;
                return { id: p.id, title: p.title, price: parse_price(p.price), description: p.description, photos: p.photos, kind, brand: kind == "watch" ? p.brand : undefined, details: details_payload(p.details) };
            }),
        };

        const parsed = demo_schema.safeParse(payload);
        if (!parsed.success) {
            const next: Record<string, string> = {};
            for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
            set_errors(next);
            set_message({ ok: false, text: "Please fix the highlighted fields." });
            return;
        }

        set_errors({});
        start(async () => {
            const result = await save_private_demo(id, payload);
            if (!result.ok) {
                set_errors(result.fields ?? {});
                set_message({ ok: false, text: result.error });
                return;
            }
            if (is_new) {
                router.push(`/admin/demos/${id}`);
            } else {
                set_message({ ok: true, text: "Saved. The demo shows the changes now." });
                router.refresh();
            }
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
            <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 border border-secondary/30 p-4">
                <h2 className="font-secondary text-lg! text-gold sm:col-span-2 xl:col-span-3">Seller</h2>
                <Field label="Store name" value={values.name} onChange={set("name")} error={errors.name} hint="Replaces Corlane across the store, e.g. without LLC" />
                <Field label="Address (corlane.store/…)" value={values.slug} onChange={(v) => set("slug")(v.toLowerCase().replace(/\s+/g, "-"))} error={errors.slug} hint="e.g. dn or maison-dubois" />
                <Field label="Instagram handle (optional)" value={values.instagram} onChange={set("instagram")} error={errors.instagram} hint="@handle or profile link" />
                <Choice label="Category" value={values.category} onChange={set("category")} options={[{ value: "watches", label: "Watches" }, { value: "jewelry", label: "Jewelry" }, { value: "mixed", label: "Watches & jewelry" }]} />
                <Choice label="Language" value={values.language} onChange={set("language")} options={[{ value: "en", label: "English" }, { value: "fr", label: "French" }, { value: "tr", label: "Turkish" }]} />
                <Choice label="Opens in currency" value={values.currency} onChange={set("currency")} options={DEMO_CURRENCIES.map((c) => ({ value: c, label: c }))} />
                <p className="text-xs text-secondary sm:col-span-2 xl:col-span-3">
                    The link opens the real store under this name, showing only these pieces. Prices are in EUR like every store price; the store converts them for the visitor.
                </p>
            </section>

            {pieces.map((piece, index) => (
                <section key={piece.id} className="flex flex-col gap-4 border border-secondary/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-secondary text-lg! text-gold">Piece {index + 1}</h2>
                        <div className="flex gap-2 text-xs">
                            <button type="button" className="button2 px-2! py-1!" disabled={index == 0} onClick={() => move_piece(index, -1)}>
                                ↑ Up
                            </button>
                            <button type="button" className="button2 px-2! py-1!" disabled={index == pieces.length - 1} onClick={() => move_piece(index, 1)}>
                                ↓ Down
                            </button>
                            <button type="button" className="button2 px-2! py-1! text-red-400!" onClick={() => set_pieces((list) => list.filter((p) => p.id != piece.id))}>
                                Remove
                            </button>
                        </div>
                    </div>
                    {values.category != "watches" && (
                        <div className="flex flex-col gap-1 sm:w-1/2">
                            <Choice
                                label="Type (its category in the store)"
                                value={piece.kind}
                                onChange={(v) => update_piece(index, { kind: v as DemoPieceKind | "" })}
                                options={[
                                    { value: "", label: "Choose…" },
                                    ...(values.category == "mixed" ? [{ value: "watch", label: "Watch" }] : []),
                                    { value: "ring", label: "Ring" },
                                    { value: "bracelet", label: "Bracelet" },
                                    { value: "necklace", label: "Necklace" },
                                ]}
                            />
                            {errors[`pieces.${index}.kind`] && <span className="text-xs text-red-400">{errors[`pieces.${index}.kind`]}</span>}
                        </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Title" value={piece.title} onChange={(v) => update_piece(index, { title: v })} error={errors[`pieces.${index}.title`]} />
                        <Field label="Price in EUR" value={piece.price} onChange={(v) => update_piece(index, { price: v })} error={errors[`pieces.${index}.price`]} hint="Numbers only, e.g. 12500" />
                        {(values.category == "watches" || piece.kind == "watch") && <Field label="Brand (optional)" value={piece.brand} onChange={(v) => update_piece(index, { brand: v })} error={errors[`pieces.${index}.brand`]} hint="Only if clearly shown, e.g. on the dial" />}
                    </div>
                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        Description
                        <textarea rows={4} value={piece.description} onChange={(e) => update_piece(index, { description: e.target.value })} className={`border bg-transparent p-2 text-sm text-foreground outline-none focus:border-gold ${errors[`pieces.${index}.description`] ? "border-red-400" : "border-secondary"}`} />
                        {errors[`pieces.${index}.description`] && <span className="text-red-400">{errors[`pieces.${index}.description`]}</span>}
                    </label>
                    <DetailsFields
                        watch={values.category == "watches" || piece.kind == "watch"}
                        ring={piece.kind == "ring"}
                        details={piece.details}
                        errors={errors}
                        prefix={`pieces.${index}.details`}
                        onChange={(key, value) => update_piece(index, { details: { ...piece.details, [key]: value } })}
                    />

                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-secondary">Photos (the first one is the cover) · {piece.photos.length}/{MAX_PIECE_PHOTOS}</p>
                        <div className="flex flex-wrap gap-2">
                            {piece.photos.map((photo, p) => (
                                <div key={photo} className="relative w-24 h-24 border border-secondary/40">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a photo that is already web-sized */}
                                    <img src={demo_photo_url(photo)} alt={`Photo ${p + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/80 text-[11px]">
                                        <button type="button" className="px-1 disabled:opacity-30" disabled={p == 0} onClick={() => update_piece(index, { photos: [photo, ...piece.photos.filter((x) => x != photo)] })}>
                                            Cover
                                        </button>
                                        <button type="button" className="px-1 text-red-400" onClick={() => update_piece(index, { photos: piece.photos.filter((x) => x != photo) })}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {piece.photos.length < MAX_PIECE_PHOTOS && (
                                <label className="w-24 h-24 border border-dashed border-secondary flex-center text-center text-xs text-secondary cursor-pointer hover:border-gold hover:text-gold">
                                    {uploading[piece.id] ? `Uploading ${uploading[piece.id]}…` : "+ Add photos"}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                        multiple
                                        className="sr-only"
                                        onChange={(e) => {
                                            add_photos(piece.id, e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                        {errors[`pieces.${index}.photos`] && <span className="text-xs text-red-400">{errors[`pieces.${index}.photos`]}</span>}
                    </div>
                </section>
            ))}

            {pieces.length < MAX_DEMO_PIECES && (
                <button type="button" className="button2 w-fit" onClick={() => set_pieces((list) => [...list, new_piece()])}>
                    + Add a piece ({pieces.length}/{MAX_DEMO_PIECES}, 3 to 6 recommended)
                </button>
            )}
            {errors.pieces && <p className="text-sm text-red-400">{errors.pieces}</p>}

            <div className="flex flex-wrap items-center gap-4 sticky bottom-0 bg-background py-3 border-t border-secondary/30">
                <button type="submit" disabled={saving} className={`button3 bg-gold text-primary px-6! py-2! ${saving ? "disabled" : ""}`}>
                    {saving ? "Saving…" : is_new ? "Create demo" : "Save changes"}
                </button>
                {message && (
                    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </form>
    );
}

/** The storefront's product details for a piece. Everything is optional; a detail left empty is not shown. */
function DetailsFields({ watch, ring, details, errors, prefix, onChange }: { watch: boolean; ring: boolean; details: DetailsState; errors: Record<string, string>; prefix: string; onChange: (key: keyof DemoPieceDetails, value: string) => void }) {
    const field = (key: keyof DemoPieceDetails, label: string, hint?: string) => <Field key={key} label={label} value={details[key] ?? ""} onChange={(v) => onChange(key, v)} error={errors[`${prefix}.${key}`]} hint={hint} />;
    const choice = (key: keyof DemoPieceDetails, label: string, options: string[]) => <Choice key={key} label={label} value={details[key] ?? ""} onChange={(v) => onChange(key, v)} options={[{ value: "", label: "Not known" }, ...options.map((o) => ({ value: o, label: o }))]} />;

    return (
        <details className="border border-secondary/20 p-3" open={Object.values(details).some(Boolean)}>
            <summary className="text-xs text-secondary cursor-pointer">Details (optional, shown in the store&apos;s Details tab; leave empty what you don&apos;t know)</summary>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-3">
                {watch
                    ? [
                          field("reference", "Reference"),
                          field("year", "Year"),
                          choice("movement", "Movement", ["Automatic", "Manual", "Quartz"]),
                          field("caseMaterial", "Case material"),
                          field("caseDiameterMm", "Case size (mm)"),
                          field("braceletMaterial", "Bracelet"),
                          field("dialColor", "Dial"),
                          field("waterResistanceM", "Water resistance (m)"),
                      ]
                    : [
                          choice("metal_type", "Metal", ["Gold", "White Gold", "Silver", "Platinum"]),
                          field("karats", "Karats", "e.g. 18"),
                          field("stones", "Stones", "Comma-separated"),
                          field("weight_g", "Weight (g)"),
                          ring ? field("ring_size", "Ring size") : field("length_cm", "Length (cm)"),
                      ]}
                {choice("condition", "Condition", ["New", "Pre-Owned"])}
                {choice("gender", "For", ["Men", "Women"])}
            </div>
        </details>
    );
}

function Field({ label, value, onChange, error, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={`border-b bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold ${error ? "border-red-400" : "border-secondary"}`} />
            {error ? <span className="text-red-400">{error}</span> : hint ? <span>{hint}</span> : null}
        </label>
    );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} className="border-b border-secondary bg-background py-1 text-sm text-foreground outline-none focus:border-gold">
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
