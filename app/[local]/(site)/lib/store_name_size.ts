/** Smaller type and tighter tracking for longer store names, so they stay on one line in the header. */
export function store_name_size(name: string): string {
    if (name.length <= 10) return "text-base sm:text-xl md:text-2xl xl:text-4xl tracking-widest";
    if (name.length <= 16) return "text-sm sm:text-lg md:text-xl xl:text-3xl tracking-wider";
    return "text-xs sm:text-base md:text-lg xl:text-2xl tracking-wide";
}
