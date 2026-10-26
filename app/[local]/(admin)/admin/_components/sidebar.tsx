"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";

const NAV = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/leads", label: "Sell / Consign" },
    { href: "/admin/appointments", label: "Appointments" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/settings", label: "Settings" },
];

export default function Sidebar({ store_name, admin_name }: { store_name: string; admin_name: string }) {
    const pathname = usePathname();
    const [open, set_open] = useState(false);

    const active = (href: string) => (href == "/admin" ? pathname == "/admin" : pathname == href || pathname.startsWith(`${href}/`));

    return (
        <>
            {/* Phone: top bar with a menu toggle */}
            <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between gap-4 bg-background border-b border-secondary/30 px-4 py-3" style={{ top: "env(safe-area-inset-top, 0px)" }}>
                <Link href="/admin" className="font-primary text-gold text-xl tracking-widest">
                    {store_name}
                </Link>
                <button type="button" onClick={() => set_open((v) => !v)} className="button2 px-3! py-1!" aria-expanded={open} aria-controls="admin-nav">
                    {open ? "Close" : "Menu"}
                </button>
            </div>

            <aside id="admin-nav" className={`${open ? "flex" : "hidden"} lg:flex flex-col gap-6 w-full lg:w-60 lg:min-h-dvh lg:sticky lg:top-0 shrink-0 border-b lg:border-b-0 lg:border-e border-secondary/30 p-4 lg:p-6 bg-background`}>
                <div className="hidden lg:flex flex-col gap-1">
                    <Link href="/admin" className="font-primary text-gold text-2xl tracking-widest">
                        {store_name}
                    </Link>
                    <p className="text-xs uppercase tracking-widest text-secondary">Admin</p>
                </div>

                <nav className="flex flex-col gap-1">
                    {NAV.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => set_open(false)}
                            className={`px-3 py-2 text-sm transition-default border-s-2 ${active(item.href) ? "border-gold text-gold bg-primary" : "border-transparent text-secondary hover:text-foreground hover:bg-primary"}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto flex flex-col gap-2 text-xs text-secondary">
                    <p className="truncate">Signed in as {admin_name}</p>
                    <Link href="/" className="underline hover:text-foreground">
                        View storefront →
                    </Link>
                </div>
            </aside>
        </>
    );
}
