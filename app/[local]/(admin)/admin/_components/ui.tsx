import { Link } from "@/i18n/routing";

/*
 * Small building blocks shared by the admin pages. Server components only (no state), so lists,
 * filters and pagination work through plain links and GET forms — reliable on a phone too.
 */

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
    return (
        <div className="w-full flex flex-wrap justify-between items-end gap-4 border-b border-secondary/30 pb-4">
            <div className="flex flex-col gap-1">
                <h1 className="font-secondary text-3xl! sm:text-4xl!">{title}</h1>
                {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={`w-full flex flex-col gap-3 border border-secondary/30 p-4 ${className}`}>
            {title && <h2 className="font-secondary text-lg! text-gold">{title}</h2>}
            {children}
        </section>
    );
}

export function StatCard({ label, value, href, hint }: { label: string; value: string | number; href?: string; hint?: string }) {
    const body = (
        <div className="h-full flex flex-col gap-1 border border-secondary/30 p-4 transition-default hover:border-gold">
            <p className="text-xs uppercase tracking-widest text-secondary">{label}</p>
            <p className="text-3xl font-secondary tabular-nums">{value}</p>
            {hint && <p className="text-xs text-secondary">{hint}</p>}
        </div>
    );
    return href ? <Link href={href}>{body}</Link> : body;
}

const BADGE_TONES: Record<string, string> = {
    gold: "border-gold text-gold",
    green: "border-emerald-500 text-emerald-500",
    red: "border-red-400 text-red-400",
    blue: "border-sky-500 text-sky-500",
    grey: "border-secondary text-secondary",
};

export function Badge({ children, tone = "grey" }: { children: React.ReactNode; tone?: keyof typeof BADGE_TONES }) {
    return <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-[11px] uppercase tracking-wider ${BADGE_TONES[tone]}`}>{children}</span>;
}

/** Table wrapper: scrolls sideways on small screens instead of squeezing columns. */
export function Table({ head, children, empty }: { head: React.ReactNode; children: React.ReactNode; empty?: string }) {
    const has_rows = Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <div className="w-full overflow-x-auto">
            <table className="admin-table w-full min-w-[640px] bg-background text-sm">
                <thead>
                    <tr>{head}</tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
            {!has_rows && <p className="py-10 text-center text-secondary text-sm">{empty ?? "Nothing here yet."}</p>}
        </div>
    );
}

export type Params = Record<string, string | undefined>;

export function href_with(base: string, params: Params, changes: Params): string {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...changes })) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `${base}?${qs}` : base;
}

export function Pagination({ base, params, page, pages, total }: { base: string; params: Params; page: number; pages: number; total: number }) {
    if (pages <= 1) return <p className="text-xs text-secondary">{total} total</p>;

    return (
        <nav className="w-full flex items-center justify-between gap-4 text-sm" aria-label="Pagination">
            <p className="text-xs text-secondary">
                {total} total · page {page} of {pages}
            </p>
            <div className="flex gap-2">
                {page > 1 ? (
                    <Link className="button2 px-3! py-1!" href={href_with(base, params, { page: String(page - 1) })}>
                        ← Previous
                    </Link>
                ) : null}
                {page < pages ? (
                    <Link className="button2 px-3! py-1!" href={href_with(base, params, { page: String(page + 1) })}>
                        Next →
                    </Link>
                ) : null}
            </div>
        </nav>
    );
}

/** GET form for search + filters; submits to the current page, which also resets to page 1. */
export function FilterBar({ children }: { children: React.ReactNode }) {
    return (
        <form action="" method="get" className="w-full flex flex-wrap items-end gap-3">
            {children}
            <button type="submit" className="button px-4! py-2!">
                Apply
            </button>
        </form>
    );
}

export function SearchField({ value, placeholder = "Search…" }: { value?: string; placeholder?: string }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary min-w-56 flex-1">
            Search
            <input name="q" defaultValue={value} placeholder={placeholder} className="border-b border-secondary bg-transparent py-1 text-sm text-foreground outline-none focus:border-gold" />
        </label>
    );
}

export function SelectFilter({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
    return (
        <label className="flex flex-col gap-1 text-xs text-secondary">
            {label}
            <select name={name} defaultValue={value ?? ""} className="border-b border-secondary bg-background py-1 text-sm text-foreground outline-none focus:border-gold">
                <option value="">All</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-secondary/20 py-2 text-sm">
            <p className="sm:w-48 shrink-0 text-secondary">{label}</p>
            <div className="min-w-0 break-words">{children}</div>
        </div>
    );
}

export function format_date(value: Date | string | undefined, with_time = false): string {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-GB", with_time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value));
}

export const PAGE_SIZE = 25;

export function page_of(params: Params): number {
    const n = Number(params.page);
    return Number.isInteger(n) && n > 0 ? n : 1;
}
