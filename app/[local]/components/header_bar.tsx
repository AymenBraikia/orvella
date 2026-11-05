import Link from "next/link";
import MenuBurger from "./svg/menu_burger";
import { store_name_size } from "../(site)/lib/store_name_size";

/**
 * The fixed header bar: a top strip (`banner`), the menu button and search on the start side, the
 * store name in the middle and the store's controls (`end`) on the other side; `children` are the
 * drawers it opens.
 */
export default function HeaderBar({ banner, nav_open, onMenu, search, name, home_href = "/", end, children }: { banner?: React.ReactNode; nav_open: boolean; onMenu: () => void; search?: React.ReactNode; name: string; home_href?: string; end: React.ReactNode; children?: React.ReactNode }) {
    return (
        <header className={`flex flex-col w-dvw fixed top-0 inset-s-0 z-4000 h-fit min-h-20 text-primary bg-background`}>
            {banner}
            <div className="w-full flex justify-between items-center sm:px-8 py-4 sm:py-2 px-[5dvw]">
                <div className={`w-1/3 flex justify-between items-center transition-default ${nav_open ? "opacity-0" : "opacity-100"} gap-2`}>
                    <button aria-label={"menu"} type="button" className="button2 p-1 md:p-auto" onClick={onMenu}>
                        <MenuBurger classnames="w-5 sm:w-8" clr={"currentColor"} />
                    </button>
                    <div className="">{search}</div>
                </div>

                {/* The seller's own name as text, never the Corlane logo: each demo should read as the dealer's own shop. */}
                <div className="w-1/3 min-w-0 flex-center">
                    <Link aria-label={"home"} href={home_href} title={name} className={`block max-w-full truncate font-primary uppercase ${store_name_size(name)}`}>
                        {name}
                    </Link>
                </div>

                <div className="flex justify-end items-center gap-2 w-1/3">{end}</div>
            </div>
            {children}
        </header>
    );
}
