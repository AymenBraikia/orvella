import { ChangeEvent, ChangeEventHandler, FocusEventHandler, Ref, useState } from "react";

interface inputProps {
    placeholder?: string;
    label: string;
    type: "email" | "tel" | "number" | "password" | "text" | "radio";
    required?: boolean;
    name?: string;
    ref?: Ref<HTMLInputElement>;
    def_value?: string;
    value?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    allowed?: boolean;
    checked?: boolean;
    max?: number | string;
    min?: number | string;
}

export default function Input({ placeholder, label, type, required = false, name, ref, def_value, value, onChange, onBlur, allowed = true, checked, max, min }: inputProps) {
    const [val, set_val] = useState<string>(def_value || "");

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (value === undefined) {
            set_val(e.target.value);
        }

        if (onChange) {
            onChange(e);
        }
    };

    const displayValue = value != undefined ? value : val;

    return (
        <div className={`w-full h-fit flex ${type == "radio" ? "items-center" : "flex-col items-start"} justify-center gap-2 ${allowed ? "" : "cursor-not-allowed! brightness-50"}`}>
            <label className={`min-w-fit ${type == "radio" ? "w-full" : ""}`} htmlFor={label}>
                {label + (required && type != "radio" ? "*" : "")}
            </label>
            <input
                max={isNaN(Number(max)) ? undefined : Number(max)}
                maxLength={isNaN(Number(max)) ? undefined : Number(max)}
                min={isNaN(Number(min)) ? undefined : Number(min)}
                minLength={isNaN(Number(min)) ? undefined : Number(min)}
                readOnly={!allowed}
                ref={ref}
                className={`w-full outline-none text-base border-b py-1 ${allowed ? "" : "cursor-not-allowed!"}`}
                placeholder={placeholder}
                name={name}
                id={label}
                type={type}
                value={displayValue}
                onChange={handleChange}
                onBlur={onBlur}
                required={allowed && required}
                checked={checked}
            />
        </div>
    );
}
