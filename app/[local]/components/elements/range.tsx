"use client";

import { useEffect, useId, useRef, useState } from "react";

interface RangeProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
    label: string;
    format?: (n: number) => string;
    fromLabel?: string;
    toLabel?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export default function Range({ min, max, value, onChange, step = 1, label, format = String, fromLabel = "From", toLabel = "To" }: RangeProps) {
    const track = useRef<HTMLDivElement>(null);
    const dragging = useRef<0 | 1 | null>(null);
    const id = useId();

    const span = Math.max(1, max - min);
    const percent = (n: number) => ((clamp(n, min, max) - min) / span) * 100;

    const commit = (index: 0 | 1, next: number) => {
        const snapped = clamp(Math.round(next / step) * step, min, max);
        if (index === 0) onChange([Math.min(snapped, value[1]), value[1]]);
        else onChange([value[0], Math.max(snapped, value[0])]);
    };

    const value_at = (clientX: number) => {
        const rect = track.current?.getBoundingClientRect();
        if (!rect) return min;
        return min + ((clientX - rect.left) / rect.width) * span;
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const at = value_at(e.clientX);
        const index: 0 | 1 = Math.abs(at - value[0]) <= Math.abs(at - value[1]) ? 0 : 1;

        dragging.current = index;
        e.currentTarget.setPointerCapture(e.pointerId);
        commit(index, at);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current === null) return;
        commit(dragging.current, value_at(e.clientX));
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        dragging.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const onKeyDown = (index: 0 | 1) => (e: React.KeyboardEvent) => {
        const jump = Math.max(step, Math.round(span / 10));
        let next = value[index];

        switch (e.key) {
            case "ArrowLeft":
            case "ArrowDown":
                next -= step;
                break;
            case "ArrowRight":
            case "ArrowUp":
                next += step;
                break;
            case "PageDown":
                next -= jump;
                break;
            case "PageUp":
                next += jump;
                break;
            case "Home":
                next = min;
                break;
            case "End":
                next = max;
                break;
            default:
                return;
        }

        e.preventDefault();
        commit(index, next);
    };

    return (
        <div className="flex w-full flex-col gap-5 px-1 pb-2">
            <div className="flex items-end gap-3">
                <NumberField id={`${id}-from`} label={fromLabel} value={value[0]} min={min} max={value[1]} format={format} onCommit={(n) => commit(0, n)} />
                <span aria-hidden="true" className="pb-1 text-secondary">
                    –
                </span>
                <NumberField id={`${id}-to`} label={toLabel} value={value[1]} min={value[0]} max={max} format={format} onCommit={(n) => commit(1, n)} />
            </div>

            <div ref={track} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} className="relative h-6 w-full cursor-pointer touch-none select-none">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-secondary opacity-40" />
                <div className="absolute top-1/2 h-px -translate-y-1/2 bg-foreground" style={{ left: `${percent(value[0])}%`, right: `${100 - percent(value[1])}%` }} />

                {([0, 1] as const).map((index) => (
                    <button
                        key={index}
                        type="button"
                        role="slider"
                        aria-label={`${label} — ${index === 0 ? fromLabel : toLabel}`}
                        aria-valuemin={index === 0 ? min : value[0]}
                        aria-valuemax={index === 0 ? value[1] : max}
                        aria-valuenow={value[index]}
                        aria-valuetext={format(value[index])}
                        onKeyDown={onKeyDown(index)}
                        className="group absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        style={{ left: `${percent(value[index])}%` }}
                    >
                        <span className="pointer-events-none absolute bottom-full inset-s-1/2 mb-2 -translate-x-1/2 whitespace-nowrap text-xs text-secondary opacity-0 transition-default group-focus-visible:opacity-100 group-hover:opacity-100">
                            {format(value[index])}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function NumberField({ id, label, value, min, max, format, onCommit }: { id: string; label: string; value: number; min: number; max: number; format: (n: number) => string; onCommit: (n: number) => void }) {
    const [draft, setDraft] = useState<string>(String(value));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!editing) setDraft(String(value));
    }, [value, editing]);

    const commit = () => {
        setEditing(false);
        const parsed = Number(draft);
        if (Number.isFinite(parsed)) onCommit(clamp(parsed, min, max));
        else setDraft(String(value));
    };

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor={id} className="text-[11px] uppercase tracking-[0.15em] text-secondary">
                {label}
            </label>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                value={editing ? draft : format(value)}
                onFocus={() => {
                    setEditing(true);
                    setDraft(String(value));
                }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                        setDraft(String(value));
                        setEditing(false);
                    }
                }}
                className="w-full min-w-0 border-b border-secondary bg-transparent py-1 text-sm tabular-nums outline-none transition-default focus:border-foreground"
            />
        </div>
    );
}
