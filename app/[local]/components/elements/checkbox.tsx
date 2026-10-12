"use client";
import { Dispatch, SetStateAction } from "react";

type CheckBoxProps = {
    label: string;
    active?: boolean;
    name?: string;
    action?: Dispatch<SetStateAction<boolean>> | ((e: boolean) => void);
};

export default function CheckBox({ label, active = false, name, action }: CheckBoxProps) {
    return (
        <button type="button" className="cursor-pointer flex w-full items-center justify-start gap-3" aria-pressed={active} onClick={() => action && action(!active)}>
            <input type="checkbox" name={name} id={name} hidden defaultChecked={active} />
            <span className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-all ${active ? "border-foreground bg-foreground text-background" : "border opacity-60 bg-transparent"}`}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3.5 w-3.5 transition-default ${active ? "opacity-100" : "opacity-0"}`}
                    aria-hidden="true"
                >
                    <path d="M5 12.5 9.5 17 19 7.5" />
                </svg>
            </span>
            <span className={`text-sm flex justify-start items-center h-full transition-default ${active ? "opacity-100" : "opacity-60"}`}>{label}</span>
        </button>
    );
}
