"use client";

import { useTheme } from "next-themes";
import { useMounted } from "./hooks/use_mounted";
import Sun from "./svg/sun";
import Moon from "./svg/moon";

export function NavThemeToggle() {
    const mounted = useMounted();
    const { resolvedTheme, setTheme } = useTheme();

    const set_light = () => setTheme("light");
    const set_dark = () => setTheme("dark");


    if (!mounted) return null;

    return (
        <div className="flex-center gap-1 border border-(--bg-secondary) h-8 sm:h-10 overflow-hidden">
            <div onClick={set_light} className={`w-full h-full p-2 flex-center ${resolvedTheme === "dark" ? "bg-background" : "bg-secondary"}`}>
                <Sun classnames="w-4 sm:w-6" clr="currentColor" />
            </div>
            <div onClick={set_dark} className={`w-full h-full p-2 flex-center ${resolvedTheme === "dark" ? "bg-secondary" : "bg-background"}`}>
                <Moon classnames="w-4 sm:w-6" clr="currentColor" />
            </div>
        </div>
    );
}
