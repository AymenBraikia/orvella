"use client";

import { useTheme } from "next-themes";
import { useMounted } from "./hooks/use_mounted";
import Sun from "./svg/sun";
import Moon from "./svg/moon";

export function ThemeToggle() {
    const mounted = useMounted();
    const { resolvedTheme, setTheme, forcedTheme } = useTheme();


    // Nothing to switch when the store forces one theme (a lead demo with a logo made for dark).
    if (!mounted || forcedTheme) return null;

    return (
        <button aria-label={`switch theme to ${resolvedTheme == "dark" ? "light" : "dark"}`} type="button" onClick={() => setTheme((prev) => (prev == "dark" ? "light" : "dark"))} className="button2 p-2">
            {resolvedTheme === "dark" ? <Sun classnames="w-6" clr="currentColor" /> : <Moon classnames="w-6" clr="currentColor" />}
        </button>
    );
}
