"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { UPLOAD_RULES, type UploadKind } from "@/app/(site)/lib/upload_rules";
import { upload_file } from "./upload_file";
import Cross from "../svg/cross";

type Entry = { id: string; name: string; preview: string; progress: number; url?: string; error?: string };

const PARALLEL_UPLOADS = 3;

/**
 * Pick photos, see thumbnails, upload them right away with progress. Reports the uploaded URLs and
 * whether anything is still uploading, so the form can wait before submitting.
 */
export default function ImagePicker({ kind, max, onChange }: { kind: UploadKind; max: number; onChange: (urls: string[], busy: boolean) => void }) {
    const t = useTranslations("common.upload");
    const rule = UPLOAD_RULES[kind];
    const max_mb = Math.round(rule.max_bytes / (1024 * 1024));

    const [entries, set_entries] = useState<Entry[]>([]);
    const [notice, set_notice] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const previews = useRef<string[]>([]);

    useEffect(() => {
        const urls = entries.filter((e) => e.url).map((e) => e.url!);
        const busy = entries.some((e) => !e.url && !e.error);
        onChange(urls, busy);
    }, [entries, onChange]);

    useEffect(() => {
        const created = previews.current;
        return () => created.forEach((p) => URL.revokeObjectURL(p));
    }, []);

    const update = (id: string, patch: Partial<Entry>) => set_entries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    async function start(files: { id: string; file: File }[]) {
        const queue = [...files];
        const worker = async () => {
            for (let next = queue.shift(); next; next = queue.shift()) {
                const { id, file } = next;
                try {
                    const url = await upload_file(file, kind, (progress) => update(id, { progress }));
                    update(id, { url, progress: 100 });
                } catch {
                    update(id, { error: t("failed", { name: file.name }) });
                }
            }
        };
        await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));
    }

    function on_select(list: FileList | null) {
        if (!list) return;
        set_notice(null);

        const room = max - entries.filter((e) => !e.error).length;
        const picked = Array.from(list);
        const accepted: { id: string; file: File }[] = [];
        const added: Entry[] = [];

        for (const file of picked) {
            if (!rule.content_types.includes(file.type)) {
                set_notice(t("notImage", { name: file.name }));
                continue;
            }
            if (file.size > rule.max_bytes) {
                set_notice(t("tooLarge", { name: file.name, max: max_mb }));
                continue;
            }
            if (accepted.length >= room) {
                set_notice(t("tooMany", { max }));
                break;
            }

            const id = crypto.randomUUID();
            const preview = URL.createObjectURL(file);
            previews.current.push(preview);
            accepted.push({ id, file });
            added.push({ id, name: file.name, preview, progress: 0 });
        }

        if (input.current) input.current.value = "";
        if (!added.length) return;

        set_entries((current) => [...current, ...added]);
        start(accepted);
    }

    function remove(id: string) {
        const entry = entries.find((e) => e.id === id);
        if (entry) URL.revokeObjectURL(entry.preview);
        set_entries((list) => list.filter((e) => e.id !== id));
    }

    const remaining = max - entries.filter((e) => !e.error).length;

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {entries.map((e) => (
                    <div key={e.id} className="relative aspect-square bg-primary overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob: previews cannot go through next/image */}
                        <img src={e.preview} alt={e.name} className={`w-full h-full object-cover ${e.url ? "" : "opacity-60"}`} onError={(ev) => (ev.currentTarget.style.visibility = "hidden")} />

                        {!e.url && !e.error && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary">
                                <div className="h-full bg-gold transition-all" style={{ width: `${e.progress}%` }} />
                            </div>
                        )}
                        {!e.url && !e.error && <span className="absolute inset-0 flex-center text-xs font-sans">{t("uploading", { progress: Math.round(e.progress) })}</span>}
                        {e.error && <span className="absolute inset-0 flex-center text-center p-2 text-xs text-red-400 bg-background/80 font-sans">{e.error}</span>}

                        <button type="button" aria-label={t("remove")} onClick={() => remove(e.id)} className="absolute top-1 inset-e-1 bg-background/80 p-0.5 cursor-pointer">
                            <Cross classnames="w-5" />
                        </button>
                    </div>
                ))}
            </div>

            {remaining > 0 && (
                <label className="button w-full text-center cursor-pointer">
                    {t("add")}
                    <input ref={input} type="file" multiple accept={rule.content_types.join(",")} className="sr-only" onChange={(e) => on_select(e.target.files)} />
                </label>
            )}

            <p className="text-xs text-secondary font-sans">{t("hint", { max, size: max_mb })}</p>
            {notice && (
                <p role="alert" className="text-red-400 text-sm">
                    {notice}
                </p>
            )}
        </div>
    );
}
