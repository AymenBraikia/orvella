"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/watches", label: "Watches" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/enquiries", label: "Enquiries" },
];

export default function Sidebar({ name }: { name: string }) {
    const pathname = usePathname();
    const params = useSearchParams();

    const is_active = (href: string) => (href === "/admin" ? pathname.endsWith("/admin") : pathname.includes(href));

    return (
        <aside className="md:w-60 md:min-h-dvh shrink-0 border-b md:border-b-0 md:border-r border-(--foreground)/15 p-5 flex md:flex-col gap-4 md:gap-6 items-center md:items-stretch justify-between">
            <div className="hidden md:block">
                <p className="font-secondary tracking-[0.2em] text-lg">{params.get("ref") || "Arvell"}</p>
                <p className="text-xs opacity-50 mt-1">Signed in as {name}</p>
            </div>

            <nav className="flex md:flex-col gap-1 overflow-x-auto">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-2 text-sm whitespace-nowrap rounded transition-[background-color,opacity] duration-300 ${is_active(link.href) ? "bg-secondary opacity-100" : "opacity-60 hover:opacity-100"}`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            <Link href="/" className="text-xs opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap md:mt-auto">
                View site
            </Link>
        </aside>
    );
}
