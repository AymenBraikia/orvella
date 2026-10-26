"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { upload_file } from "@/app/components/upload/upload_file";
import { UPLOAD_RULES } from "@/app/(site)/lib/upload_rules";

type Pending = { id: string; name: string; progress: number; error?: string };

/**
 * Product photos and video. The first image is the main one (cards, search, social previews).
 * Reorder by dragging, or with the arrow buttons on touch screens.
 */
export default function MediaManager({
    images,
    video,
    onChange,
    onBusy,
}: {
    images: string[];
    video: string;
    onChange: (images: string[], video: string) => void;
    onBusy: (busy: boolean) => void;
}) {
    const [pending, set_pending] = useState<Pending[]>([]);
    const [video_progress, set_video_progress] = useState<number | null>(null);
    const [notice, set_notice] = useState<string | null>(null);
    const dragged = useRef<number | null>(null);
    // Uploads finish after re-renders; always append to the newest list.
    const latest = useRef({ images, video });
    useEffect(() => {
        latest.current = { images, video };
    }, [images, video]);

    const image_rule = UPLOAD_RULES.product_image;
    const video_rule = UPLOAD_RULES.product_video;

    function move(from: number, to: number) {
        if (to < 0 || to >= images.length || from === to) return;
        const next = [...images];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next, video);
    }

    async function add_images(files: FileList | null) {
        if (!files?.length) return;
        set_notice(null);

        const list = Array.from(files).filter((file) => {
            if (!image_rule.content_types.includes(file.type)) {
                set_notice(`${file.name}: not a supported image type`);
                return false;
            }
            if (file.size > image_rule.max_bytes) {
                set_notice(`${file.name}: larger than ${image_rule.max_bytes / 1024 / 1024} MB`);
                return false;
            }
            return true;
        });
        if (!list.length) return;

        const jobs = list.map((file) => ({ id: crypto.randomUUID(), file }));
        set_pending((p) => [...p, ...jobs.map((j) => ({ id: j.id, name: j.file.name, progress: 0 }))]);
        onBusy(true);

        // Sequential keeps the order the dealer picked.
        for (const job of jobs) {
            try {
                const url = await upload_file(job.file, "product_image", (progress) => set_pending((p) => p.map((x) => (x.id === job.id ? { ...x, progress } : x))));
                const next = [...latest.current.images, url];
                latest.current = { ...latest.current, images: next };
                onChange(next, latest.current.video);
                set_pending((p) => p.filter((x) => x.id !== job.id));
            } catch {
                set_pending((p) => p.map((x) => (x.id === job.id ? { ...x, error: "Upload failed" } : x)));
            }
        }
        onBusy(false);
    }

    async function add_video(file: File | undefined) {
        if (!file) return;
        if (!video_rule.content_types.includes(file.type)) return set_notice("Video must be MP4 or WebM");
        if (file.size > video_rule.max_bytes) return set_notice(`Video is larger than ${video_rule.max_bytes / 1024 / 1024} MB`);

        set_notice(null);
        set_video_progress(0);
        onBusy(true);
        try {
            const url = await upload_file(file, "product_video", set_video_progress);
            onChange(latest.current.images, url);
        } catch {
            set_notice("Video upload failed");
        }
        set_video_progress(null);
        onBusy(false);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {images.map((src, i) => (
                    <div
                        key={src}
                        draggable
                        onDragStart={() => (dragged.current = i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                            if (dragged.current !== null) move(dragged.current, i);
                            dragged.current = null;
                        }}
                        className={`relative flex flex-col border ${i === 0 ? "border-gold" : "border-secondary/30"} bg-primary cursor-grab active:cursor-grabbing`}
                    >
                        <div className="relative aspect-square">
                            <Image src={src} alt={`Image ${i + 1}`} fill sizes="200px" className="object-cover pointer-events-none" />
                            {i === 0 && <span className="absolute top-1 inset-s-1 bg-gold text-primary text-[10px] uppercase tracking-wider px-1.5 py-0.5">Main</span>}
                        </div>
                        <div className="flex flex-wrap justify-between gap-1 p-1 text-xs">
                            <div className="flex gap-1">
                                <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)} className="button2 px-2! py-0.5!">
                                    ←
                                </button>
                                <button type="button" aria-label="Move right" disabled={i === images.length - 1} onClick={() => move(i, i + 1)} className="button2 px-2! py-0.5!">
                                    →
                                </button>
                            </div>
                            {i !== 0 && (
                                <button type="button" onClick={() => move(i, 0)} className="button2 px-2! py-0.5!">
                                    Make main
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() =>
                                    onChange(
                                        images.filter((_, j) => j !== i),
                                        video,
                                    )
                                }
                                className="button2 px-2! py-0.5! text-red-400!"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}

                {pending.map((p) => (
                    <div key={p.id} className="relative aspect-square flex-center flex-col gap-2 border border-dashed border-secondary/50 p-2 text-center text-xs">
                        <p className="break-all line-clamp-2">{p.name}</p>
                        {p.error ? (
                            <>
                                <p className="text-red-400">{p.error}</p>
                                <button type="button" className="underline" onClick={() => set_pending((list) => list.filter((x) => x.id !== p.id))}>
                                    Dismiss
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-1 bg-secondary">
                                <div className="h-full bg-gold" style={{ width: `${p.progress}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <label className="button w-fit cursor-pointer">
                + Add photos
                <input type="file" multiple accept={image_rule.content_types.join(",")} className="sr-only" onChange={(e) => {
                        add_images(e.target.files);
                        e.target.value = "";
                    }} />
            </label>
            <p className="text-xs text-secondary">Drag photos to reorder. The first photo is the main image. JPG, PNG, WebP, AVIF or HEIC up to {image_rule.max_bytes / 1024 / 1024} MB.</p>

            <div className="flex flex-col gap-2 border-t border-secondary/20 pt-4">
                <p className="text-sm">Video (optional, plays on hover in the shop)</p>
                {video ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <a href={video} target="_blank" rel="noreferrer" className="underline break-all">
                            {video.split("/").pop()}
                        </a>
                        <button type="button" onClick={() => onChange(images, "")} className="button2 px-2! py-0.5! text-xs text-red-400!">
                            Remove video
                        </button>
                    </div>
                ) : video_progress !== null ? (
                    <div className="w-60 h-1 bg-secondary">
                        <div className="h-full bg-gold" style={{ width: `${video_progress}%` }} />
                    </div>
                ) : (
                    <label className="button2 w-fit cursor-pointer text-sm">
                        Upload video
                        <input type="file" accept={video_rule.content_types.join(",")} className="sr-only" onChange={(e) => {
                                add_video(e.target.files?.[0]);
                                e.target.value = "";
                            }} />
                    </label>
                )}
            </div>

            {notice && (
                <p role="alert" className="text-sm text-red-400">
                    {notice}
                </p>
            )}
        </div>
    );
}
