"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Sun from "./svg/sun";
import Moon from "./svg/moon";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button aria-label={`switch theme to ${resolvedTheme == "dark" ? "light" : "dark"}`} type="button" onClick={() => setTheme((prev) => (prev == "dark" ? "light" : "dark"))} className="button2 p-2">
            {resolvedTheme === "dark" ? <Sun classnames="w-6" clr="currentColor" /> : <Moon classnames="w-6" clr="currentColor" />}
        </button>
    );
}
