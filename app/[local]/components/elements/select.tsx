"use client";
import { Activity, Dispatch, SetStateAction, useState } from "react";
import Arrow from "../svg/arrow";

interface SelectProps {
    options: string[];
    value: string;
    set_value: Dispatch<SetStateAction<string>>;
    label?: string;
    classnames?: string;
}

export default function Select({ options, value, set_value, label, classnames }: SelectProps) {
    const [active, set_active] = useState<boolean>(false);

    return (
        <div className={`w-full flex justify-between items-center relative z-60 ${classnames ? classnames : ""}`}>
            <div onClick={() => set_active(!active)} className="font-semibold cursor-pointer flex justify-start items-center gap-2">
                {label && <p className="font-normal">{label}</p>}
                <p>{value}</p>
                <Arrow classnames={`transition-default ${active ? "rotate-180" : "rotate-0"} w-6`} />
            </div>

            <div
                className={`w-full absolute inset-s-0 translate-y-full bg-primary min-w-fit overflow-x-hidden select-none transition-default ${active ? "overflow-y-auto max-h-100 opacity-100 -bottom-4" : "max-h-0 overflow-y-hidden opacity-0 bottom-0"}`}
            >
                {new Array(...new Set(options)).map((o) => (
                    <p
                        key={o}
                        className="whitespace-nowrap text-secondary hover:text-foreground bg-secondary hover:bg-background transition-default cursor-pointer px-2 py-1"
                        onClick={() => {
                            set_value(o);
                            set_active(false);
                        }}
                    >
                        {o}
                    </p>
                ))}
            </div>
        </div>
    );
}
